"""
Centralized Application Exception Hierarchy.

Provides custom exception classes with HTTP status codes and user-friendly error codes.
Ensures consistent JSON error responses across all endpoints.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base exception class for domain errors."""

    def __init__(
        self,
        status_code: int,
        message: str,
        code: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail={"error": message, "code": code, "details": details or {}},
        )
        self.code = code
        self.message = message


class ResourceNotFoundError(AppException):
    """Raised when a requested resource (Employee, LeaveRequest, Session) is not found."""

    def __init__(self, resource: str, identifier: Any) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{resource} with identifier '{identifier}' was not found.",
            code="RESOURCE_NOT_FOUND",
        )


class ValidationError(AppException):
    """Raised when business validation rules fail (e.g. insufficient leave balance)."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            code="VALIDATION_ERROR",
            details=details,
        )


class AuthenticationError(AppException):
    """Raised when credentials are invalid or JWT authentication fails."""

    def __init__(self, message: str = "Invalid username or password.") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="AUTHENTICATION_FAILED",
        )


class PermissionDeniedError(AppException):
    """Raised when a user attempts an action restricted to another role (e.g., admin)."""

    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="PERMISSION_DENIED",
        )


class LLMUnavailableError(AppException):
    """Raised when LLM API call fails after retries."""

    def __init__(self, message: str = "AI service is temporarily unavailable. Using cached policy retrieval.") -> None:
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=message,
            code="LLM_SERVICE_UNAVAILABLE",
        )
