"""
Authentication & Authorization Security Module.

Handles:
    - Bcrypt password hashing and verification
    - JWT Access & Refresh Token creation and decoding using python-jose
    - Role-Based Access Control (RBAC) dependency factory
    - Login rate limiting (sliding window, max 5 failed attempts per 10 mins)
    - Reusable FastAPI dependencies (get_current_user, require_role)
"""

from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional
import bcrypt
from fastapi import Depends, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.exceptions import AuthenticationError, PermissionDeniedError
from app.logging_config import log_event, logger
from app.models import User
from app.repositories.user_repository import UserRepository

settings = get_settings()

# OAuth2 Scheme for Swagger UI integration
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


# ============================================================
# Password Hashing Utilities
# ============================================================
def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ============================================================
# JWT Token Generation & Decoding
# ============================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT Access Token with user metadata and expiration."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a signed JWT Refresh Token with longer expiration."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and validate a JWT token.

    Raises:
        AuthenticationError: If token is expired, malformed, or has invalid type.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_type = payload.get("type")
        if token_type != expected_type:
            log_event("unauthorized_access", {"reason": f"Expected {expected_type} token, got {token_type}"}, level="warning")
            raise AuthenticationError("Invalid token type.")

        return payload

    except JWTError as e:
        error_msg = str(e).lower()
        if "expired" in error_msg or "signature has expired" in error_msg:
            log_event("expired_token", {"error": str(e)}, level="warning")
            raise AuthenticationError("Token has expired. Please log in again.")

        log_event("unauthorized_access", {"error": str(e)}, level="warning")
        raise AuthenticationError("Invalid authentication token.")


# ============================================================
# Login Rate Limiter (In-Memory Sliding Window)
# ============================================================
class LoginRateLimiter:
    """
    In-memory rate limiter tracking failed login attempts.
    Blocks key after MAX_FAILED_ATTEMPTS within WINDOW_SECONDS.
    """

    MAX_FAILED_ATTEMPTS = 5
    WINDOW_SECONDS = 600  # 10 minutes

    def __init__(self) -> None:
        self._failed_attempts: dict = {}

    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier (username or IP) is currently blocked."""
        now = datetime.now(timezone.utc).timestamp()
        attempts = self._failed_attempts.get(identifier, [])

        # Filter out attempts outside time window
        valid_attempts = [t for t in attempts if now - t < self.WINDOW_SECONDS]
        self._failed_attempts[identifier] = valid_attempts

        return len(valid_attempts) >= self.MAX_FAILED_ATTEMPTS

    def record_failed_attempt(self, identifier: str) -> None:
        """Record a failed login attempt for an identifier."""
        now = datetime.now(timezone.utc).timestamp()
        if identifier not in self._failed_attempts:
            self._failed_attempts[identifier] = []
        self._failed_attempts[identifier].append(now)

    def reset(self, identifier: str) -> None:
        """Clear failed attempts on successful login."""
        self._failed_attempts.pop(identifier, None)


login_rate_limiter = LoginRateLimiter()


# ============================================================
# Reusable FastAPI Dependencies
# ============================================================
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency validating the Authorization Bearer JWT token.
    Returns the authenticated User ORM model instance.
    """
    if not token:
        log_event("unauthorized_access", {"reason": "Missing Authorization header"}, level="warning")
        raise AuthenticationError("Authentication required. Please provide a Bearer token.")

    payload = decode_token(token, expected_type="access")
    username: Optional[str] = payload.get("sub")

    if not username:
        raise AuthenticationError("Token payload missing subject.")

    repo = UserRepository(db)
    user = repo.get_by_username(username)

    if not user:
        log_event("unauthorized_access", {"reason": f"User '{username}' no longer exists"}, level="warning")
        raise AuthenticationError("Authenticated user account no longer exists.")

    return user


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Role-based Access Control (RBAC) dependency factory.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(["admin"]))])
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            log_event(
                "forbidden_access",
                {
                    "username": current_user.username,
                    "user_role": current_user.role,
                    "required_roles": allowed_roles,
                },
                level="warning",
            )
            raise PermissionDeniedError(
                f"Role '{current_user.role}' is not authorized to access this resource. Required: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker
