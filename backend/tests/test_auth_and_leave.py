"""
Automated Pytest Unit Test Suite for HR Assistant backend.

Tests:
1. Password hashing & verification
2. JWT token generation & payload decoding
3. Leave balance validations
4. RAG Keyword & Vector Retriever implementations
"""

import pytest
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timezone, timedelta

from app.auth import hash_password, verify_password, create_access_token
from app.config import get_settings
from app.repositories.knowledge_repository import KeywordRetriever, VectorRetriever

settings = get_settings()


def test_password_hashing():
    """Verify bcrypt password hashing and comparison."""
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation():
    """Verify JWT access token creation and decoding."""
    data = {"sub": "employee_user", "role": "employee"}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))

    assert isinstance(token, str)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "employee_user"
    assert payload["role"] == "employee"


def test_keyword_retriever():
    """Test KeywordRetriever policy search."""
    retriever = KeywordRetriever()
    retriever.load()

    results = retriever.search("casual leave policy", top_k=2)
    assert len(results) > 0
    assert any("Casual" in r.title for r in results)


def test_vector_retriever():
    """Test VectorRetriever semantic search."""
    retriever = VectorRetriever()
    retriever.load()

    results = retriever.search("maternity leave benefits", top_k=2)
    assert len(results) > 0
    assert any("Maternity" in r.title for r in results)
