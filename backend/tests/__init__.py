"""
Test Suite for HR Assistant Backend.

Uses pytest with FastAPI TestClient.
Fixtures in conftest.py provide:
    - In-memory SQLite test database
    - FastAPI test client
    - Mock LLM service
    - Pre-seeded test data
    - Auth headers for employee/admin roles
"""
