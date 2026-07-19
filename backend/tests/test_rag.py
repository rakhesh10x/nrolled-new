"""
RAG Engine & Knowledge Base Test Suite.

Verifies:
    - Intent Classification accuracy across different query types
    - KeywordRetriever search and relevance scoring against knowledge_base.json
    - RAG Prompt building
    - Fallback response generation when LLM is unavailable
    - Chat endpoints (/api/v1/chat/suggestions, /sessions, /message)
"""

import pytest
from app.repositories.knowledge_repository import KeywordRetriever
from app.services.intent_classifier import IntentCategory, IntentClassifier
from app.services.prompt_templates import FALLBACK_RESPONSE_TEMPLATE, RAG_PROMPT_TEMPLATE


def test_intent_classifier():
    """Verify IntentClassifier maps user questions to correct intent categories."""
    assert IntentClassifier.classify("Hi there")[0] == IntentCategory.GREETING
    assert IntentClassifier.classify("How many leaves do I have left?")[0] == IntentCategory.LEAVE_BALANCE
    assert IntentClassifier.classify("Show my leave history")[0] == IntentCategory.LEAVE_HISTORY
    assert IntentClassifier.classify("Who is my manager?")[0] == IntentCategory.EMPLOYEE_INFO
    assert IntentClassifier.classify("What is the casual leave policy?")[0] == IntentCategory.HR_POLICY
    assert IntentClassifier.classify("When is salary credited?")[0] == IntentCategory.PAYROLL
    assert IntentClassifier.classify("What are the working hours?")[0] == IntentCategory.ATTENDANCE


def test_keyword_retriever():
    """Verify KeywordRetriever loads knowledge_base.json and returns relevant policy chunks."""
    retriever = KeywordRetriever()
    retriever.load()

    # Query about casual leave
    results = retriever.search("casual leave policy", top_k=2)
    assert len(results) > 0
    assert "Casual Leave" in results[0].title
    assert results[0].source == "HR Policy Manual 2026, Section 4.1 - Casual Leave"

    # Query about WFH
    wfh_results = retriever.search("work from home remote hybrid", top_k=1)
    assert len(wfh_results) > 0
    assert "Work From Home" in wfh_results[0].category


def test_prompt_template_formatting():
    """Verify RAG prompt and fallback template string formatting."""
    rag_prompt = RAG_PROMPT_TEMPLATE.format(
        user_role="employee",
        username="employee",
        employee_data="Remaining Leave Balance: 13 days",
        retrieved_knowledge="Casual Leave: 12 days/year",
        conversation_history="None",
        user_question="How many casual leaves do I have?",
    )
    assert "Remaining Leave Balance: 13 days" in rag_prompt
    assert "How many casual leaves do I have?" in rag_prompt

    fallback = FALLBACK_RESPONSE_TEMPLATE.format(
        retrieved_content="Employees get 12 CLs per year.",
        source="HR Policy Manual Section 4.1",
    )
    assert "HR Policy Manual Section 4.1" in fallback
    assert "offline mode" in fallback


def test_chat_suggestions_endpoint(client, employee_token_headers, admin_token_headers):
    """Test /api/v1/chat/suggestions returns role-tailored prompt suggestions."""
    emp_resp = client.get("/api/v1/chat/suggestions", headers=employee_token_headers)
    assert emp_resp.status_code == 200
    emp_suggestions = emp_resp.json()
    assert len(emp_suggestions) > 0
    assert "How many leave days do I have left?" in emp_suggestions

    admin_resp = client.get("/api/v1/chat/suggestions", headers=admin_token_headers)
    assert admin_resp.status_code == 200
    admin_suggestions = admin_resp.json()
    assert len(admin_suggestions) > 0
    assert "Show pending leave requests" in admin_suggestions


def test_chat_session_crud(client, employee_token_headers):
    """Test Chat Session CRUD endpoints (/sessions, /messages, DELETE /sessions)."""
    # 1. Create session
    create_resp = client.post("/api/v1/chat/sessions", headers=employee_token_headers)
    assert create_resp.status_code == 201
    session_uuid = create_resp.json()["uuid"]

    # 2. List sessions
    list_resp = client.get("/api/v1/chat/sessions", headers=employee_token_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 3. Get session messages (initially empty)
    msg_resp = client.get(f"/api/v1/chat/sessions/{session_uuid}/messages", headers=employee_token_headers)
    assert msg_resp.status_code == 200
    assert len(msg_resp.json()) == 0

    # 4. Delete session
    del_resp = client.delete(f"/api/v1/chat/sessions/{session_uuid}", headers=employee_token_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Chat session deleted successfully."
