"""
User Data Repository.

Encapsulates all database operations for User and Employee entities.
Supports user lookup, role verification, and soft-delete filtering.
"""

from typing import Optional
from sqlalchemy.orm import Session, joinedload

from app.models import Employee, User


class UserRepository:
    """Repository class for User database access."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch active user by primary key with employee details eager-loaded."""
        return (
            self.db.query(User)
            .options(joinedload(User.employee))
            .filter(User.id == user_id, User.deleted_at.is_(None))
            .first()
        )

    def get_by_username(self, username: str) -> Optional[User]:
        """Fetch active user by username with employee details eager-loaded."""
        return (
            self.db.query(User)
            .options(joinedload(User.employee))
            .filter(User.username == username, User.deleted_at.is_(None))
            .first()
        )

    def get_employee_by_user_id(self, user_id: int) -> Optional[Employee]:
        """Fetch associated active employee profile for a given user ID."""
        user = self.get_by_id(user_id)
        if user and user.employee and user.employee.deleted_at is None:
            return user.employee
        return None
