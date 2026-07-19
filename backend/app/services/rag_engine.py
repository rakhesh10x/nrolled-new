"""
RAG (Retrieval-Augmented Generation) Orchestration Engine.

Pipeline:
    1. Classify query intent (IntentClassifier)
    2. Retrieve relevant HR Knowledge chunks (IRetriever) & Employee DB records
    3. Format conversation memory history
    4. Construct augmented prompt (PromptTemplates)
    5. Stream tokens via LLMService with exponential backoff retries (3x)
    6. Fall back to cached knowledge base response if retries fail
    7. Persist messages and return SSE stream
"""

import asyncio
import json
import time
from typing import AsyncGenerator, Dict, List, Optional
from sqlalchemy.orm import Session

from app.logging_config import log_event, logger
from app.models import User
from app.repositories.chat_repository import ChatRepository
from app.repositories.knowledge_repository import get_retriever
from app.repositories.user_repository import UserRepository
from app.services.intent_classifier import IntentCategory, IntentClassifier
from app.services.llm_service import LLMService
from app.services.prompt_templates import (
    FALLBACK_RESPONSE_TEMPLATE,
    RAG_PROMPT_TEMPLATE,
    SYSTEM_PROMPT,
)


class RAGEngine:
    """Orchestrates RAG retrieval, prompt augmentation, LLM streaming, and fallback handling."""

    MAX_RETRIES = 3

    def __init__(self, db: Session) -> None:
        self.db = db
        self.retriever = get_retriever()
        self.llm_service = LLMService.get_instance()
        self.chat_repo = ChatRepository(db)
        self.user_repo = UserRepository(db)

    def _fetch_employee_data_str(self, user: User, user_message: str, intent: IntentCategory) -> str:
        """Fetch employee DB context string for the current user and any named employee in user_message."""
        from app.models import Employee, LeaveRequest

        context_blocks = []

        # 1. Current Logged-in User Profile
        if user.employee:
            emp = user.employee
            remaining = emp.annual_leave - (emp.casual_leave_used + emp.sick_leave_used + emp.earned_leave_used)
            context_blocks.append(f"Logged-in User Profile:\n"
                                   f"- Employee ID: {emp.emp_id}\n"
                                   f"- Name: {emp.name}\n"
                                   f"- Department: {emp.department}\n"
                                   f"- Designation: {emp.designation}\n"
                                   f"- Manager: {emp.manager or 'N/A'}\n"
                                   f"- Attendance: {emp.attendance_pct}%\n"
                                   f"- Annual Leave: {emp.annual_leave} days\n"
                                   f"- Casual Leave Used: {emp.casual_leave_used} days\n"
                                   f"- Sick Leave Used: {emp.sick_leave_used} days\n"
                                   f"- Earned Leave Used: {emp.earned_leave_used} days\n"
                                   f"- Remaining Balance: {remaining} days")
            if intent == IntentCategory.PAYROLL:
                context_blocks.append(f"- Monthly Salary: ₹{emp.salary:,.2f} (Credit Date: 25th)")

        # 2. Search for any specific employee mentioned in user message (e.g. "Rakesh", "John", "Priya")
        all_employees = self.db.query(Employee).filter(Employee.deleted_at.is_(None)).all()
        emp_names_str = ", ".join([f"{e.name} ({e.emp_id}, {e.department})" for e in all_employees])
        context_blocks.append(f"\nCompany Employee Directory ({len(all_employees)} Employees Total):\n{emp_names_str}")

        # Check if user message contains specific keywords matching any employee name or emp_id
        matching_employees = []
        msg_words = user_message.lower().split()
        for e in all_employees:
            name_parts = e.name.lower().split()
            if any(word in msg_words for word in name_parts) or e.emp_id.lower() in user_message.lower():
                matching_employees.append(e)

        if matching_employees:
            context_blocks.append("\nSpecific Employee Records Found in Database:")
            for me in matching_employees:
                m_rem = me.annual_leave - (me.casual_leave_used + me.sick_leave_used + me.earned_leave_used)
                recent_leaves = self.db.query(LeaveRequest).filter_by(employee_id=me.id).all()
                leave_summary = ", ".join([f"{l.leave_type} ({l.days}d, {l.status})" for l in recent_leaves]) or "No leave history"
                context_blocks.append(
                    f"  * {me.name} ({me.emp_id}): Dept={me.department}, Designation={me.designation}, "
                    f"Attendance={me.attendance_pct}%, Remaining Leave={m_rem} days "
                    f"(Casual used: {me.casual_leave_used}, Sick used: {me.sick_leave_used}, Earned used: {me.earned_leave_used}). "
                    f"Leave Requests: [{leave_summary}]"
                )

        return "\n".join(context_blocks)

    def _fetch_admin_data_str(self, user_message: str) -> str:
        """Fetch comprehensive admin DB context string including employee lookup."""
        from app.models import Employee, LeaveRequest

        all_employees = self.db.query(Employee).filter(Employee.deleted_at.is_(None)).all()
        total_emp = len(all_employees)
        pending_leaves = self.db.query(LeaveRequest).filter_by(status="PENDING").all()
        approved_count = self.db.query(LeaveRequest).filter_by(status="APPROVED").count()
        rejected_count = self.db.query(LeaveRequest).filter_by(status="REJECTED").count()

        pending_details = []
        for pl in pending_leaves:
            emp = self.db.query(Employee).filter_by(id=pl.employee_id).first()
            emp_name = emp.name if emp else "Unknown"
            pending_details.append(f"[{pl.uuid}] {emp_name} ({pl.leave_type}): {pl.start_date} to {pl.end_date} ({pl.days} days) - Reason: '{pl.reason}'")

        pending_str = "\n  ".join(pending_details) if pending_details else "No pending leave requests"

        emp_summary_list = []
        for e in all_employees:
            rem = e.annual_leave - (e.casual_leave_used + e.sick_leave_used + e.earned_leave_used)
            emp_summary_list.append(f"{e.name} ({e.emp_id}, {e.department}): Remaining Leave={rem}d, Attendance={e.attendance_pct}%")

        emp_summary_str = "\n  ".join(emp_summary_list)

        return f"""
Admin System Overview:
- Total Employees: {total_emp}
- Pending Leave Requests Count: {len(pending_leaves)}
- Approved Leaves Count: {approved_count}
- Rejected Leaves Count: {rejected_count}

Pending Leave Requests List:
  {pending_str}

All Company Employees Summary:
  {emp_summary_str}
"""

    async def generate_rag_stream(
        self,
        user: User,
        user_message: str,
        session_uuid: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Main entry point for generating streaming RAG response.

        Yields:
            Server-Sent Events (SSE) string chunks: data: {"token": "...", "done": false}
        """
        start_time = time.perf_counter()

        # 1. Load or Create Chat Session
        if session_uuid:
            session = self.chat_repo.get_session_by_uuid(session_uuid, user.id)
            if not session:
                session = self.chat_repo.create_session(user.id, title=user_message[:30])
        else:
            session = self.chat_repo.create_session(user.id, title=user_message[:30])

        # Save User Message to DB
        user_msg_obj = self.chat_repo.add_message(session.id, role="user", content=user_message)

        # 2. Intent Classification
        intent, confidence = IntentClassifier.classify(user_message, user_role=user.role)
        logger.info(
            f"Intent classified: {intent.value} (confidence: {confidence:.2f})",
            extra={"request_id": "rag"},
        )

        # 3. Knowledge Base & DB Context Retrieval
        retrieval_start = time.perf_counter()
        retrieved_chunks = self.retriever.search(user_message, top_k=3)
        retrieval_ms = (time.perf_counter() - retrieval_start) * 1000

        sources = [chunk.source for chunk in retrieved_chunks]
        sources_text = "\n\n".join([f"[{chunk.title}] ({chunk.source}):\n{chunk.content}" for chunk in retrieved_chunks]) or "No matching policy found."

        # Fetch DB Data Context
        if user.role == "admin" and intent == IntentCategory.ADMIN_QUERY:
            db_data_str = self._fetch_admin_data_str(user_message)
        else:
            db_data_str = self._fetch_employee_data_str(user, user_message, intent)

        # 4. Conversation History (Memory Context Window)
        recent_history = self.chat_repo.get_recent_messages(session.id, limit=6)
        history_str = "\n".join([f"{m.role.upper()}: {m.content}" for m in recent_history[:-1]]) or "None"

        # 5. Build Augmented Prompt
        user_prompt = RAG_PROMPT_TEMPLATE.format(
            user_role=user.role,
            username=user.username,
            employee_data=db_data_str,
            retrieved_knowledge=sources_text,
            conversation_history=history_str,
            user_question=user_message,
        )

        # 6. Stream LLM Response with Exponential Backoff Retry (3x)
        full_response_text = ""
        llm_start = time.perf_counter()
        retry_count = 0
        success = False

        for attempt in range(self.MAX_RETRIES):
            try:
                tokens_stream = self.llm_service.stream_completion(SYSTEM_PROMPT, user_prompt)
                async for token in tokens_stream:
                    full_response_text += token
                    payload = json.dumps({"token": token, "done": False})
                    yield f"data: {payload}\n\n"

                success = True
                break

            except Exception as err:
                retry_count += 1
                backoff_sec = 2 ** attempt  # 1s, 2s, 4s
                log_event(
                    "llm_retry",
                    {"attempt": attempt + 1, "error": str(err), "backoff_sec": backoff_sec},
                    level="warning",
                )
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(backoff_sec)

        # 7. Fallback Mode if LLM Retries Exceeded
        if not success:
            log_event(
                "llm_fallback_triggered",
                {"user_id": user.id, "intent": intent.value, "retries": retry_count},
                level="warning",
            )
            fallback_text = FALLBACK_RESPONSE_TEMPLATE.format(
                retrieved_content=sources_text,
                source=sources[0] if sources else "HR Policy Manual 2026",
            )
            full_response_text = fallback_text

            # Yield fallback response token
            payload = json.dumps({"token": fallback_text, "done": False})
            yield f"data: {payload}\n\n"

        llm_latency_ms = (time.perf_counter() - llm_start) * 1000
        total_ms = (time.perf_counter() - start_time) * 1000

        # Save Assistant Response to DB
        assistant_msg_obj = self.chat_repo.add_message(
            session_id=session.id,
            role="assistant",
            content=full_response_text,
            sources=sources,
        )

        # Log Metrics
        log_event(
            "rag_chat_completed",
            {
                "user_id": user.id,
                "session_uuid": session.uuid,
                "intent": intent.value,
                "retrieval_ms": f"{retrieval_ms:.2f}",
                "llm_latency_ms": f"{llm_latency_ms:.2f}",
                "total_ms": f"{total_ms:.2f}",
                "retry_count": retry_count,
                "used_fallback": not success,
                "sources_count": len(sources),
            },
            level="info",
        )

        # 8. Final SSE Event with metadata
        final_payload = json.dumps({
            "token": "",
            "done": True,
            "session_uuid": session.uuid,
            "message_id": assistant_msg_obj.id,
            "sources": sources,
        })
        yield f"data: {final_payload}\n\n"
