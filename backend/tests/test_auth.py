"""
Authentication & Authorization Test Suite.

Verifies:
    - Successful login (returns access_token, refresh_token, user metadata)
    - Invalid password returns 401 Unauthorized
    - GET /api/v1/auth/me with valid Bearer token
    - Unauthorized access with missing or expired token (401)
    - Refresh token workflow (POST /api/v1/auth/refresh)
    - Role-based authorization (403 Forbidden on insufficient role)
"""

from datetime import timedelta
from fastapi import Depends
from app.auth import create_access_token, require_role
from app.main import app


# Dynamic temporary test endpoints for role checking
@app.get("/api/v1/test/admin-only", dependencies=[Depends(require_role(["admin"]))])
def admin_only_endpoint():
    return {"message": "Admin access granted"}


@app.get(
    "/api/v1/test/employee-only",
    dependencies=[Depends(require_role(["employee"]))],
)
def employee_only_endpoint():
    return {"message": "Employee access granted"}


def test_login_success(client):
    """Test successful authentication for demo employee user."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "employee", "password": "employee123"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "employee"
    assert data["user"]["role"] == "employee"
    assert data["user"]["employee_name"] == "John Smith"


def test_login_invalid_password(client):
    """Test login failure with wrong password returns 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "employee", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]["error"]


def test_get_me_success(client, employee_token_headers):
    """Test GET /api/v1/auth/me returns current user profile."""
    response = client.get("/api/v1/auth/me", headers=employee_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "employee"
    assert data["role"] == "employee"
    assert data["employee_name"] == "John Smith"


def test_unauthorized_missing_token(client):
    """Test protected endpoint without Authorization header returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_expired_token(client):
    """Test accessing protected route with expired token returns 401."""
    expired_token = create_access_token(
        {"sub": "employee", "role": "employee", "user_id": 1},
        expires_delta=timedelta(seconds=-10),  # expired 10s ago
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "Token has expired" in response.json()["detail"]["error"]


def test_refresh_token_success(client):
    """Test issuing a new access token using a valid refresh token."""
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "employee", "password": "employee123"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


def test_admin_only_endpoint_success(client, admin_token_headers):
    """Admin token should successfully access admin-only endpoint."""
    response = client.get("/api/v1/test/admin-only", headers=admin_token_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Admin access granted"


def test_admin_only_endpoint_forbidden_for_employee(client, employee_token_headers):
    """Employee token should receive 403 Forbidden on admin-only endpoint."""
    response = client.get(
        "/api/v1/test/admin-only", headers=employee_token_headers
    )
    assert response.status_code == 403
    assert "is not authorized" in response.json()["detail"]["error"]


def test_employee_only_endpoint_success(client, employee_token_headers):
    """Employee token should successfully access employee-only endpoint."""
    response = client.get(
        "/api/v1/test/employee-only", headers=employee_token_headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Employee access granted"
