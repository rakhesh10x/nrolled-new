"""
Pydantic V2 Request and Response Schemas.

Defines type-safe data transfer objects (DTOs) for API request validation
and response serialization, including generic pagination support.
"""

from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


# ============================================================
# Generic Pagination Schema
# ============================================================
class PaginatedResponse(BaseModel, Generic[T]):
    """Generic wrapper for paginated API responses."""

    items: List[T]
    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, le=100, description="Items per page")
    total: int = Field(ge=0, description="Total record count")
    total_pages: int = Field(ge=0, description="Total available pages")

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Auth & User Schemas
# ============================================================
class LoginRequest(BaseModel):
    """Payload for POST /api/v1/auth/login."""

    username: str = Field(..., min_length=3, max_length=50, json_schema_extra={"example": "employee"})
    password: str = Field(..., min_length=4, max_length=100, json_schema_extra={"example": "employee123"})


class RefreshTokenRequest(BaseModel):
    """Payload for POST /api/v1/auth/refresh."""

    refresh_token: str = Field(..., description="Valid refresh token")


class TokenResponse(BaseModel):
    """JWT Token response payload."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserRead"


class UserRead(BaseModel):
    """User profile data serialization."""

    id: int
    username: str
    role: str
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Employee Schemas
# ============================================================
class EmployeeRead(BaseModel):
    """Employee full profile response schema."""

    id: int
    emp_id: str
    name: str
    email: EmailStr
    department: str
    designation: str
    manager: Optional[str] = None
    salary: float
    attendance_pct: float
    annual_leave: int
    casual_leave_used: int
    sick_leave_used: int
    earned_leave_used: int
    remaining_leave: int = Field(..., description="Calculated: annual_leave - (casual + sick + earned)")
    date_of_joining: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmployeeSummary(BaseModel):
    """Lightweight employee representation for lists."""

    id: int
    emp_id: str
    name: str
    department: str
    designation: str
    attendance_pct: float

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Leave Request Schemas
# ============================================================
class LeaveRequestCreate(BaseModel):
    """Payload for POST /api/v1/employee/leave/apply."""

    leave_type: str = Field(..., description="Casual Leave, Sick Leave, or Earned Leave", json_schema_extra={"example": "Casual Leave"})
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", json_schema_extra={"example": "2026-07-25"})
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", json_schema_extra={"example": "2026-07-27"})
    reason: str = Field(..., min_length=5, max_length=500, json_schema_extra={"example": "Family function"})


class LeaveActionRequest(BaseModel):
    """Payload for admin approving or rejecting a leave request."""

    reason: Optional[str] = Field(None, max_length=250, json_schema_extra={"example": "Approved based on available balance"})


class LeaveRequestRead(BaseModel):
    """Leave request detailed response schema."""

    id: int
    uuid: str
    employee_id: int
    employee_name: Optional[str] = None
    emp_id: Optional[str] = None
    department: Optional[str] = None
    leave_type: str
    start_date: str
    end_date: str
    days: int
    reason: str
    status: str
    created_by: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Chat Schemas
# ============================================================
class ChatMessageCreate(BaseModel):
    """Payload for POST /api/v1/chat/message."""

    session_uuid: Optional[str] = Field(None, description="UUID of existing session, or null for new session")
    content: str = Field(..., min_length=1, max_length=2000, json_schema_extra={"example": "How many leave days do I have left?"})


class ChatMessageRead(BaseModel):
    """Chat message response object."""

    id: int
    role: str
    content: str
    sources: List[str] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionRead(BaseModel):
    """Chat session metadata object."""

    id: int
    uuid: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Dashboard Statistics Schemas
# ============================================================
class EmployeeDashboardStats(BaseModel):
    """Employee dashboard aggregate statistics."""

    annual_leave: int
    used_leave: int
    remaining_leave: int
    attendance_pct: float
    pending_requests_count: int
    recent_requests: List[LeaveRequestRead]
    upcoming_holidays: List[dict]


class AdminDashboardStats(BaseModel):
    """Admin dashboard aggregate statistics."""

    total_employees: int
    pending_leaves: int
    approved_leaves: int
    rejected_leaves: int
    department_counts: dict
    recent_activities: List[dict]
