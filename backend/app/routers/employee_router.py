"""
Employee Portal API Router.

Provides HTTP endpoints for employee self-service:
    - GET  /api/v1/employee/profile        (Get employee profile)
    - GET  /api/v1/employee/dashboard      (Get dashboard stats, holidays, suggestions)
    - POST /api/v1/employee/leave/apply     (Apply for leave)
    - GET  /api/v1/employee/leave/history   (Get paginated & filtered leave history)
    - POST /api/v1/employee/leave/{uuid}/cancel (Cancel pending leave request)
    - GET  /api/v1/employee/notifications  (Fetch backend notification toast events)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.exceptions import ResourceNotFoundError
from app.models import User
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.leave_repository import LeaveRepository
from app.schemas import (
    EmployeeDashboardStats,
    EmployeeRead,
    LeaveRequestCreate,
    LeaveRequestRead,
    PaginatedResponse,
)
from app.services.leave_service import LeaveService
from app.services.notification_service import NotificationService
from app.utils.constants import EMPLOYEE_SUGGESTIONS

router = APIRouter(prefix="/api/v1/employee", tags=["Employee Portal"])


@router.get(
    "/profile",
    response_model=EmployeeRead,
    summary="Get Employee Profile",
    description="Returns the employee profile record for the authenticated employee user.",
)
async def get_employee_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EmployeeRead:
    """Retrieve profile of current logged-in employee."""
    repo = EmployeeRepository(db)
    emp = repo.get_employee_by_user_id(current_user.id)
    if not emp:
        raise ResourceNotFoundError("Employee profile", current_user.employee_id)

    remaining = emp.annual_leave - (emp.casual_leave_used + emp.sick_leave_used + emp.earned_leave_used)

    return EmployeeRead(
        id=emp.id,
        emp_id=emp.emp_id,
        name=emp.name,
        email=emp.email,
        department=emp.department,
        designation=emp.designation,
        manager=emp.manager,
        salary=emp.salary,
        attendance_pct=emp.attendance_pct,
        annual_leave=emp.annual_leave,
        casual_leave_used=emp.casual_leave_used,
        sick_leave_used=emp.sick_leave_used,
        earned_leave_used=emp.earned_leave_used,
        remaining_leave=remaining,
        date_of_joining=emp.date_of_joining,
        created_at=emp.created_at,
    )


@router.get(
    "/dashboard",
    response_model=EmployeeDashboardStats,
    summary="Get Employee Dashboard",
    description="Returns aggregated dashboard metrics: leave remaining, attendance %, recent requests, upcoming holidays, and prompt chips.",
)
async def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EmployeeDashboardStats:
    """Retrieve employee dashboard stats and recent requests."""
    emp_repo = EmployeeRepository(db)
    leave_repo = LeaveRepository(db)

    emp = emp_repo.get_employee_by_user_id(current_user.id)
    if not emp:
        raise ResourceNotFoundError("Employee profile", current_user.employee_id)

    total_used = emp.casual_leave_used + emp.sick_leave_used + emp.earned_leave_used
    remaining = emp.annual_leave - total_used

    # Recent leave requests
    recent_leaves, pending_count = leave_repo.list_employee_leaves(
        employee_id=emp.id,
        page=1,
        page_size=5,
    )

    recent_reads = [
        LeaveRequestRead(
            id=lr.id,
            uuid=lr.uuid,
            employee_id=lr.employee_id,
            employee_name=emp.name,
            emp_id=emp.emp_id,
            department=emp.department,
            leave_type=lr.leave_type,
            start_date=lr.start_date,
            end_date=lr.end_date,
            days=lr.days,
            reason=lr.reason,
            status=lr.status,
            created_by=lr.created_by,
            reviewed_by=lr.reviewed_by,
            reviewed_at=lr.reviewed_at,
            created_at=lr.created_at,
        )
        for lr in recent_leaves
    ]

    upcoming_holidays = [
        {"name": "Independence Day", "date": "2026-08-15", "day": "Saturday"},
        {"name": "Ganesh Chaturthi", "date": "2026-09-14", "day": "Monday"},
        {"name": "Gandhi Jayanti", "date": "2026-10-02", "day": "Friday"},
        {"name": "Diwali", "date": "2026-11-08", "day": "Sunday"},
    ]

    return EmployeeDashboardStats(
        annual_leave=emp.annual_leave,
        used_leave=total_used,
        remaining_leave=remaining,
        attendance_pct=emp.attendance_pct,
        pending_requests_count=pending_count,
        recent_requests=recent_reads,
        upcoming_holidays=upcoming_holidays,
    )


@router.post(
    "/leave/apply",
    response_model=LeaveRequestRead,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for Leave",
    description="Submits a new leave request after validating date ranges, overlaps, and available leave balance.",
)
async def apply_for_leave(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeaveRequestRead:
    """Submit a new leave application."""
    leave_service = LeaveService(db)
    leave = leave_service.apply_leave(current_user, payload)

    emp = current_user.employee

    return LeaveRequestRead(
        id=leave.id,
        uuid=leave.uuid,
        employee_id=leave.employee_id,
        employee_name=emp.name if emp else None,
        emp_id=emp.emp_id if emp else None,
        department=emp.department if emp else None,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave.days,
        reason=leave.reason,
        status=leave.status,
        created_by=leave.created_by,
        reviewed_by=leave.reviewed_by,
        reviewed_at=leave.reviewed_at,
        created_at=leave.created_at,
    )


@router.get(
    "/leave/history",
    response_model=PaginatedResponse[LeaveRequestRead],
    summary="Get Leave History",
    description="Returns paginated leave request history for the current employee with status and date filtering.",
)
async def get_leave_history(
    status_filter: Optional[str] = Query(None, alias="status", description="PENDING, APPROVED, REJECTED"),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[LeaveRequestRead]:
    """Get employee leave history with filtering and pagination."""
    if not current_user.employee_id:
        raise ResourceNotFoundError("Employee profile", current_user.id)

    repo = LeaveRepository(db)
    items, total = repo.list_employee_leaves(
        employee_id=current_user.employee_id,
        status=status_filter,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    read_items = [
        LeaveRequestRead(
            id=lr.id,
            uuid=lr.uuid,
            employee_id=lr.employee_id,
            employee_name=current_user.employee.name if current_user.employee else None,
            emp_id=current_user.employee.emp_id if current_user.employee else None,
            department=current_user.employee.department if current_user.employee else None,
            leave_type=lr.leave_type,
            start_date=lr.start_date,
            end_date=lr.end_date,
            days=lr.days,
            reason=lr.reason,
            status=lr.status,
            created_by=lr.created_by,
            reviewed_by=lr.reviewed_by,
            reviewed_at=lr.reviewed_at,
            created_at=lr.created_at,
        )
        for lr in items
    ]

    return PaginatedResponse(
        items=read_items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.post(
    "/leave/{leave_uuid}/cancel",
    response_model=dict,
    summary="Cancel Pending Leave Request",
    description="Cancels a pending leave request owned by the employee.",
)
async def cancel_leave_request(
    leave_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Cancel a pending leave application."""
    leave_service = LeaveService(db)
    leave_service.cancel_leave(current_user, leave_uuid)
    return {"message": "Leave request cancelled successfully.", "uuid": leave_uuid}


@router.get(
    "/notifications",
    response_model=List[dict],
    summary="Get Unread Toast Notifications",
)
async def get_user_notifications(current_user: User = Depends(get_current_user)) -> List[dict]:
    """Fetch pending backend toast notification events for current user."""
    events = NotificationService.get_user_notifications(current_user.id)
    return [e.model_dump() for e in events]
