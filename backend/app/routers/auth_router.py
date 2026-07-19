"""
Authentication API Router.

Provides HTTP endpoints for:
    - POST /api/v1/auth/login   (Authenticate credentials, return JWT access + refresh tokens)
    - GET  /api/v1/auth/me      (Retrieve current authenticated user profile)
    - POST /api/v1/auth/refresh  (Generate new access token using valid refresh token)
    - POST /api/v1/auth/logout   (Stateless logout confirmation)
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    login_rate_limiter,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.exceptions import AppException, AuthenticationError
from app.logging_config import log_event
from app.models import User
from app.repositories.user_repository import UserRepository
from app.schemas import LoginRequest, RefreshTokenRequest, TokenResponse, UserRead

settings = get_settings()

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User",
    description="Validates username and password, enforces rate limiting, and returns JWT access & refresh tokens.",
    responses={
        200: {"description": "Authentication successful. Returns JWT tokens and user profile."},
        400: {"description": "Malformed request payload."},
        401: {"description": "Invalid credentials."},
        429: {"description": "Too many failed login attempts. Rate limit exceeded."},
    },
)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user credentials and issue JWT tokens."""
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{payload.username.lower()}:{client_ip}"

    # Rate Limiting Check
    if login_rate_limiter.is_rate_limited(rate_limit_key):
        log_event(
            "login_rate_limited",
            {"username": payload.username, "ip": client_ip},
            level="warning",
        )
        raise AppException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message="Too many failed login attempts. Please try again in 10 minutes.",
            code="RATE_LIMIT_EXCEEDED",
        )

    # Repository Lookup
    user_repo = UserRepository(db)
    user = user_repo.get_by_username(payload.username.lower())

    # Credential Validation
    if not user or not verify_password(payload.password, user.password_hash):
        login_rate_limiter.record_failed_attempt(rate_limit_key)
        log_event(
            "user_login_failed",
            {"username": payload.username, "ip": client_ip, "reason": "Invalid credentials"},
            level="warning",
        )
        raise AuthenticationError("Invalid username or password.")

    # Successful Login
    login_rate_limiter.reset(rate_limit_key)
    log_event(
        "user_login",
        {"username": user.username, "role": user.role, "user_id": user.id, "ip": client_ip},
        level="info",
    )

    # Token Creation
    token_data = {"sub": user.username, "role": user.role, "user_id": user.id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    emp_name = user.employee.name if user.employee else None
    dept = user.employee.department if user.employee else None

    user_read = UserRead(
        id=user.id,
        username=user.username,
        role=user.role,
        employee_id=user.employee_id,
        employee_name=emp_name,
        department=dept,
        created_at=user.created_at,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=user_read,
    )


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns the profile information of the currently authenticated user.",
    responses={
        200: {"description": "Successfully retrieved current user profile."},
        401: {"description": "Missing, expired, or invalid Bearer token."},
    },
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """Retrieve currently authenticated user profile."""
    emp_name = current_user.employee.name if current_user.employee else None
    dept = current_user.employee.department if current_user.employee else None

    return UserRead(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        employee_id=current_user.employee_id,
        employee_name=emp_name,
        department=dept,
        created_at=current_user.created_at,
    )


@router.post(
    "/refresh",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    description="Generates a new access token using a valid refresh token.",
    responses={
        200: {"description": "New access token generated successfully."},
        401: {"description": "Invalid or expired refresh token."},
    },
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Issue a new access token given a valid refresh token."""
    decoded = decode_token(payload.refresh_token, expected_type="refresh")
    username: str = decoded.get("sub", "")

    user_repo = UserRepository(db)
    user = user_repo.get_by_username(username)

    if not user:
        raise AuthenticationError("User account associated with token no longer exists.")

    token_data = {"sub": user.username, "role": user.role, "user_id": user.id}
    new_access_token = create_access_token(token_data)

    log_event("token_refreshed", {"username": user.username}, level="info")

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log Out User",
    description="Stateless logout endpoint. Client should discard stored tokens.",
)
async def logout(current_user: User = Depends(get_current_user)) -> dict:
    """Log out current user."""
    log_event("user_logout", {"username": current_user.username}, level="info")
    return {"message": "Logged out successfully."}
