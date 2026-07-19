"""
Business Logic Services Package.

Contains orchestration and business rules (no direct DB access):
    - llm_service:       Singleton Oxlo.ai client (OpenAI SDK)
    - rag_engine:        RAG orchestrator with retry/fallback
    - intent_classifier: Query intent classification
    - prompt_templates:  System prompts and context templates
    - chat_service:      Chat session/message orchestration
    - leave_service:     Leave validation and balance logic
"""
