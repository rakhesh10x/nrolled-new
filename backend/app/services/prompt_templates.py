"""
Centralized Prompt Templates for RAG Engine.

Defines structured prompts for System Instructions, Employee Context,
Admin Context, Policy Context, and Fallback mode.
"""

# ============================================================
# System Base Prompt
# ============================================================
SYSTEM_PROMPT = """You are an AI HR Assistant for TechCorp Solutions Pvt. Ltd.
Your purpose is to assist employees and administrators with accurate, helpful, and professional HR information.

CRITICAL INSTRUCTIONS:
1. Base your answers ONLY on the provided CONTEXT (HR Policies and Employee Database Records).
2. Never invent policies, balances, or employee details not explicitly present in the context.
3. If the requested information is not in the context, politely state: "I don't have that information in the HR knowledge base."
4. Always cite the exact source section when answering policy questions (e.g., "Source: HR Policy Manual 2026, Section 4.1").
5. Format your responses clearly using Markdown (bullet points, bold text, tables where applicable).
6. Be friendly, empathetic, and professional in tone.
"""

# ============================================================
# RAG Augmented User Prompt Template
# ============================================================
RAG_PROMPT_TEMPLATE = """
--- USER CONTEXT ---
User Role: {user_role}
Username: {username}

--- EMPLOYEE / DATABASE RECORDS ---
{employee_data}

--- RETRIEVED HR POLICIES ---
{retrieved_knowledge}

--- CONVERSATION HISTORY ---
{conversation_history}

--- USER QUESTION ---
{user_question}

Answer the user's question clearly and concisely based on the context above.
Include source citations at the end if you referenced policy documents.
"""

# ============================================================
# Fallback Template (When LLM API is unavailable)
# ============================================================
FALLBACK_RESPONSE_TEMPLATE = """I retrieved the relevant HR Policy information from our knowledge base for you:

{retrieved_content}

📌 **Source**: {source}

*(Note: AI synthesis is currently operating in offline mode. The above policy details were fetched directly from the HR Knowledge Base.)*
"""
