"""
SQLAlchemy 2.0 Typed Database Models.

Defines ORM entities for User, Employee, LeaveRequest, ChatSession, and ChatMessage.
Includes UTC timestamps, soft-delete columns, public UUIDs, constraints, and indexes.
"""

from datetime import datetime, timezone
import uuid
from typing import List, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    """Helper returning timezone-aware current UTC time."""
    return datetime.now(timezone.utc)


# ============================================================
# 1. Employee Model
# ============================================================
class Employee(Base):
    """
    Employee domain entity.
    Stores employment profile, leave balances, salary, and manager relationships.
    """

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    department: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    manager: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Financial & Attendance Data
    salary: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    attendance_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    # Leave Balances
    annual_leave: Mapped[int] = mapped_column(Integer, default=18, nullable=False)
    casual_leave_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sick_leave_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    earned_leave_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    date_of_joining: Mapped[str] = mapped_column(String(20), nullable=False)

    # Timestamps & Soft Delete
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="employee", uselist=False
    )
    leave_requests: Mapped[List["LeaveRequest"]] = relationship(
        "LeaveRequest", back_populates="employee", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("salary > 0", name="check_positive_salary"),
        CheckConstraint(
            "attendance_pct >= 0 AND attendance_pct <= 100",
            name="check_attendance_range",
        ),
        CheckConstraint("annual_leave >= 0", name="check_positive_annual_leave"),
        CheckConstraint("casual_leave_used >= 0", name="check_positive_casual_used"),
        CheckConstraint("sick_leave_used >= 0", name="check_positive_sick_used"),
        CheckConstraint("earned_leave_used >= 0", name="check_positive_earned_used"),
    )


# ============================================================
# 2. User Model
# ============================================================
class User(Base):
    """
    System User entity for authentication.
    Linked to an Employee record via employee_id foreign key.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")

    # Foreign Key to Employee
    employee_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )

    # Timestamps & Soft Delete
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    employee: Mapped[Optional["Employee"]] = relationship(
        "Employee", back_populates="user"
    )
    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )


# ============================================================
# 3. LeaveRequest Model
# ============================================================
class LeaveRequest(Base):
    """
    Leave Application entity.
    Tracks employee leave submissions, status (PENDING/APPROVED/REJECTED), and audit log.
    """

    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    employee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )

    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Casual, Sick, Earned
    start_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10), nullable=False)    # YYYY-MM-DD
    days: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING", index=True
    )  # PENDING, APPROVED, REJECTED

    # Audit Trail
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="leave_requests"
    )

    __table_args__ = (
        CheckConstraint("days > 0", name="check_positive_leave_days"),
    )


# ============================================================
# 4. ChatSession Model
# ============================================================
class ChatSession(Base):
    """
    Chat Conversation Session entity.
    Maintains user conversation context for multi-turn chatbot history.
    """

    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False, default="New Chat")

    # Timestamps & Soft Delete
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )


# ============================================================
# 5. ChatMessage Model
# ============================================================
class ChatMessage(Base):
    """
    Individual chat message within a session.
    Stores user queries, AI responses, and attached source citations.
    """

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of sources

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    session: Mapped["ChatSession"] = relationship(
        "ChatSession", back_populates="messages"
    )
