"""
Employee Repository.

Encapsulates data access queries for Employee entities, including search,
department filtering, and paginated directory listings.
"""

from typing import List, Optional, Tuple
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import Employee


class EmployeeRepository:
    """Repository handling Employee database queries."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, employee_id: int) -> Optional[Employee]:
        """Fetch active employee by primary key."""
        return (
            self.db.query(Employee)
            .filter(Employee.id == employee_id, Employee.deleted_at.is_(None))
            .first()
        )

    def get_by_emp_id(self, emp_id: str) -> Optional[Employee]:
        """Fetch active employee by public EMP code (e.g. EMP001)."""
        return (
            self.db.query(Employee)
            .filter(Employee.emp_id == emp_id, Employee.deleted_at.is_(None))
            .first()
        )

    def get_employee_by_user_id(self, user_id: int) -> Optional[Employee]:
        """Fetch active employee profile associated with a user ID."""
        from app.models import User
        user = self.db.query(User).filter_by(id=user_id).first()
        if user and user.employee and user.employee.deleted_at is None:
            return user.employee
        return None

    def search_employees(
        self,
        search_term: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Employee], int]:
        """
        Search and filter employees with pagination.

        Args:
            search_term: Filter by name or emp_id (case-insensitive substring)
            department: Filter by exact department name
            page: 1-indexed page number
            page_size: Items per page

        Returns:
            Tuple of (List[Employee], total_count)
        """
        query = self.db.query(Employee).filter(Employee.deleted_at.is_(None))

        if department and department.strip():
            query = query.filter(Employee.department == department.strip())

        if search_term and search_term.strip():
            term = f"%{search_term.strip()}%"
            query = query.filter(
                or_(
                    Employee.name.ilike(term),
                    Employee.emp_id.ilike(term),
                    Employee.email.ilike(term),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Employee.emp_id.asc()).offset(offset).limit(page_size).all()

        return items, total

    def get_department_counts(self) -> dict:
        """Get employee counts grouped by department."""
        results = (
            self.db.query(Employee.department, func.count(Employee.id))
            .filter(Employee.deleted_at.is_(None))
            .group_by(Employee.department)
            .all()
        )
        return {dept: count for dept, count in results}

    def get_attendance_summary(self) -> dict:
        """Get attendance summary statistics."""
        avg_att = (
            self.db.query(func.avg(Employee.attendance_pct))
            .filter(Employee.deleted_at.is_(None))
            .scalar()
            or 0.0
        )
        low_att_count = (
            self.db.query(Employee)
            .filter(Employee.deleted_at.is_(None), Employee.attendance_pct < 93.0)
            .count()
        )
        return {
            "average_attendance": round(float(avg_att), 2),
            "low_attendance_employees_count": low_att_count,
        }
