"""
Chat & RAG API Router.

Provides HTTP & SSE streaming endpoints for AI Chat:
    - POST   /api/v1/chat/message             (Send query, stream response via SSE)
    - GET    /api/v1/chat/sessions            (List active chat sessions)
    - POST   /api/v1/chat/sessions            (Create new empty session)
    - GET    /api/v1/chat/sessions/{uuid}/messages (Get messages for session)
    - DELETE /api/v1/chat/sessions/{uuid}     (Delete session)
    - GET    /api/v1/chat/suggestions         (Role-based suggested questions)
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.exceptions import ResourceNotFoundError
from app.models import User
from app.repositories.chat_repository import ChatRepository
from app.schemas import ChatMessageCreate, ChatMessageRead, ChatSessionRead
from app.services.rag_engine import RAGEngine

router = APIRouter(prefix="/api/v1/chat", tags=["AI Chatbot"])


@router.post(
    "/message",
    summary="Send Chat Message (SSE Stream)",
    description="Sends user question to RAG pipeline. Streams response tokens as Server-Sent Events (text/event-stream).",
)
async def send_chat_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute RAG pipeline and stream tokens to client via SSE."""
    rag_engine = RAGEngine(db)
    event_generator = rag_engine.generate_rag_stream(
        user=current_user,
        user_message=payload.content,
        session_uuid=payload.session_uuid,
    )

    return StreamingResponse(
        event_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/sessions",
    response_model=List[ChatSessionRead],
    summary="List User Chat Sessions",
    description="Returns all active chat sessions belonging to the authenticated user.",
)
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ChatSessionRead]:
    """List all chat sessions for current user."""
    repo = ChatRepository(db)
    sessions = repo.list_user_sessions(current_user.id)

    res = []
    for s in sessions:
        res.append(
            ChatSessionRead(
                id=s.id,
                uuid=s.uuid,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=len(s.messages),
            )
        )
    return res


@router.post(
    "/sessions",
    response_model=ChatSessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Chat Session",
)
async def create_chat_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatSessionRead:
    """Create a new empty chat session."""
    repo = ChatRepository(db)
    session = repo.create_session(current_user.id, title="New Chat")

    return ChatSessionRead(
        id=session.id,
        uuid=session.uuid,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
    )


@router.get(
    "/sessions/{session_uuid}/messages",
    response_model=List[ChatMessageRead],
    summary="Get Chat Session Messages",
)
async def get_session_messages(
    session_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ChatMessageRead]:
    """Retrieve all messages in a specific chat session."""
    repo = ChatRepository(db)
    session = repo.get_session_by_uuid(session_uuid, current_user.id)

    if not session:
        raise ResourceNotFoundError("ChatSession", session_uuid)

    messages = repo.get_recent_messages(session.id, limit=50)

    res = []
    for m in messages:
        sources_list = json.loads(m.sources_json) if m.sources_json else []
        res.append(
            ChatMessageRead(
                id=m.id,
                role=m.role,
                content=m.content,
                sources=sources_list,
                created_at=m.created_at,
            )
        )
    return res


@router.delete(
    "/sessions/{session_uuid}",
    status_code=status.HTTP_200_OK,
    summary="Delete Chat Session",
)
async def delete_chat_session(
    session_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Soft-delete a chat session."""
    repo = ChatRepository(db)
    success = repo.delete_session(session_uuid, current_user.id)

    if not success:
        raise ResourceNotFoundError("ChatSession", session_uuid)

    return {"message": "Chat session deleted successfully."}


@router.get(
    "/suggestions",
    response_model=List[str],
    summary="Get Suggested Questions",
    description="Returns role-tailored prompt suggestions for the chat interface.",
)
async def get_suggestions(current_user: User = Depends(get_current_user)) -> List[str]:
    """Return suggested questions based on user role."""
    if current_user.role == "admin":
        return [
            "Show pending leave requests",
            "How many employees are on leave today?",
            "Show employees with low attendance",
            "Department-wise leave report",
            "How many leave requests are pending?",
            "Show today's approved leaves",
        ]
    return [
        "How many leave days do I have left?",
        "What is the casual leave policy?",
        "How do I apply for leave?",
        "When is salary credited?",
        "What are the working hours?",
        "Who approves my leave?",
        "Show my leave history",
        "What is the work from home policy?",
    ]
