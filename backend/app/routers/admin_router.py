"""
Admin Portal API Router.

Provides HTTP endpoints restricted to admin users:
    - GET /api/v1/admin/dashboard             (Dashboard metrics & Recharts chart datasets)
    - GET /api/v1/admin/employees             (Search & paginated employee directory)
    - GET /api/v1/admin/leaves                (Filter & paginated leave requests across company)
    - PUT /api/v1/admin/leaves/{uuid}/approve (Approve leave request & deduct balance)
    - PUT /api/v1/admin/leaves/{uuid}/reject  (Reject leave request with reason)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models import User
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.leave_repository import LeaveRepository
from app.schemas import (
    AdminDashboardStats,
    EmployeeRead,
    EmployeeSummary,
    LeaveActionRequest,
    LeaveRequestRead,
    PaginatedResponse,
)
from app.services.leave_service import LeaveService

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin Portal"],
    dependencies=[Depends(require_role(["admin"]))],
)


@router.get(
    "/dashboard",
    response_model=AdminDashboardStats,
    summary="Get Admin Dashboard & Analytics",
    description="Returns aggregate company metrics and chart datasets formatted directly for Recharts components.",
)
async def get_admin_dashboard(db: Session = Depends(get_db)) -> AdminDashboardStats:
    """Retrieve admin dashboard statistics and Recharts chart datasets."""
    emp_repo = EmployeeRepository(db)
    leave_repo = LeaveRepository(db)

    counts = leave_repo.get_status_counts()
    dept_counts = emp_repo.get_department_counts()
    total_employees = sum(dept_counts.values())

    # Recent activities
    recent_leaves, _ = leave_repo.list_all_leaves(page=1, page_size=5)
    activities = []
    for lr in recent_leaves:
        activities.append(
            {
                "id": lr.uuid,
                "title": f"Leave Request by {lr.employee.name if lr.employee else 'Employee'}",
                "description": f"{lr.leave_type} ({lr.days} days) - Status: {lr.status}",
                "timestamp": lr.updated_at.isoformat(),
                "status": lr.status,
            }
        )

    return AdminDashboardStats(
        total_employees=total_employees,
        pending_leaves=counts["pending"],
        approved_leaves=counts["approved"],
        rejected_leaves=counts["rejected"],
        department_counts=dept_counts,
        recent_activities=activities,
    )


@router.get(
    "/analytics/leave-distribution",
    response_model=List[dict],
    summary="Get Leave Distribution Chart Data",
    description="Returns leave request count grouped by leave type formatted for Recharts PieChart.",
)
async def get_leave_distribution(db: Session = Depends(get_db)) -> List[dict]:
    """Return leave type distribution data for Recharts."""
    leave_repo = LeaveRepository(db)
    return leave_repo.get_leave_type_distribution()


@router.get(
    "/analytics/monthly-trends",
    response_model=List[dict],
    summary="Get Monthly Leave Trends Data",
    description="Returns monthly leave approval/rejection trends formatted for Recharts BarChart.",
)
async def get_monthly_trends(db: Session = Depends(get_db)) -> List[dict]:
    """Return monthly leave trend data for Recharts."""
    leave_repo = LeaveRepository(db)
    return leave_repo.get_monthly_leave_trends()


@router.get(
    "/employees",
    response_model=PaginatedResponse[EmployeeRead],
    summary="Search & Filter Employee Directory",
    description="Search employees by name, emp_id, or email with department filtering and pagination.",
)
async def search_employee_directory(
    search: Optional[str] = Query(None, description="Search by name, emp_id, or email"),
    department: Optional[str] = Query(None, description="Filter by department"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Page size"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[EmployeeRead]:
    """Search employee directory with pagination."""
    repo = EmployeeRepository(db)
    items, total = repo.search_employees(
        search_term=search,
        department=department,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    read_items = [
        EmployeeRead(
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
            remaining_leave=emp.annual_leave - (emp.casual_leave_used + emp.sick_leave_used + emp.earned_leave_used),
            date_of_joining=emp.date_of_joining,
            created_at=emp.created_at,
        )
        for emp in items
    ]

    return PaginatedResponse(
        items=read_items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get(
    "/leaves",
    response_model=PaginatedResponse[LeaveRequestRead],
    summary="List All Leave Requests",
    description="Returns all leave requests across the company with status, department, leave type, search, and pagination.",
)
async def list_company_leave_requests(
    status_filter: Optional[str] = Query(None, alias="status", description="PENDING, APPROVED, REJECTED"),
    department: Optional[str] = Query(None, description="Filter by department"),
    leave_type: Optional[str] = Query(None, description="Filter by leave type"),
    search: Optional[str] = Query(None, description="Search by employee name or emp_id"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Page size"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[LeaveRequestRead]:
    """Retrieve all leave requests with filters and pagination."""
    repo = LeaveRepository(db)
    items, total = repo.list_all_leaves(
        status=status_filter,
        department=department,
        leave_type=leave_type,
        search_term=search,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    read_items = [
        LeaveRequestRead(
            id=lr.id,
            uuid=lr.uuid,
            employee_id=lr.employee_id,
            employee_name=lr.employee.name if lr.employee else None,
            emp_id=lr.employee.emp_id if lr.employee else None,
            department=lr.employee.department if lr.employee else None,
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


@router.put(
    "/leaves/{leave_uuid}/approve",
    response_model=LeaveRequestRead,
    summary="Approve Leave Request",
    description="Approves a pending leave request, updates employee leave balance, and sets audit trail fields.",
)
async def approve_leave_request(
    leave_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeaveRequestRead:
    """Approve leave request."""
    leave_service = LeaveService(db)
    leave = leave_service.approve_leave(current_user, leave_uuid)

    return LeaveRequestRead(
        id=leave.id,
        uuid=leave.uuid,
        employee_id=leave.employee_id,
        employee_name=leave.employee.name if leave.employee else None,
        emp_id=leave.employee.emp_id if leave.employee else None,
        department=leave.employee.department if leave.employee else None,
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


@router.put(
    "/leaves/{leave_uuid}/reject",
    response_model=LeaveRequestRead,
    summary="Reject Leave Request",
    description="Rejects a pending leave request with a mandatory reason.",
)
async def reject_leave_request(
    leave_uuid: str,
    payload: LeaveActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeaveRequestRead:
    """Reject leave request with reason."""
    leave_service = LeaveService(db)
    leave = leave_service.reject_leave(current_user, leave_uuid, payload)

    return LeaveRequestRead(
        id=leave.id,
        uuid=leave.uuid,
        employee_id=leave.employee_id,
        employee_name=leave.employee.name if leave.employee else None,
        emp_id=leave.employee.emp_id if leave.employee else None,
        department=leave.employee.department if leave.employee else None,
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
    "/export/csv",
    summary="Export Leave Records to CSV",
    description="Generates a downloadable CSV report of all employee leave applications.",
)
async def export_leaves_csv(db: Session = Depends(get_db)):
    """Export all leave applications as a downloadable CSV file."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    leave_repo = LeaveRepository(db)
    leaves, _ = leave_repo.list_all_leaves(page=1, page_size=1000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Name",
        "Employee ID",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Days",
        "Status",
        "Reason",
        "Reviewed By",
        "Reviewed At",
        "Created At",
    ])

    for lr in leaves:
        writer.writerow([
            lr.employee.name if lr.employee else "N/A",
            lr.employee.emp_id if lr.employee else "N/A",
            lr.employee.department if lr.employee else "N/A",
            lr.leave_type,
            lr.start_date.isoformat() if lr.start_date else "",
            lr.end_date.isoformat() if lr.end_date else "",
            lr.days,
            lr.status,
            lr.reason,
            lr.reviewed_by or "N/A",
            lr.reviewed_at.isoformat() if lr.reviewed_at else "N/A",
            lr.created_at.isoformat() if lr.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hr_leave_report.csv"},
    )


@router.get(
    "/audit-logs",
    response_model=List[dict],
    summary="Get System Audit Logs",
    description="Returns compliance audit logs of recent admin and user activities.",
)
async def get_audit_logs(db: Session = Depends(get_db)) -> List[dict]:
    """Return system audit log events."""
    leave_repo = LeaveRepository(db)
    recent_leaves, _ = leave_repo.list_all_leaves(page=1, page_size=20)

    logs = []
    for lr in recent_leaves:
        if lr.status == "APPROVED":
            logs.append({
                "id": f"audit-appr-{lr.id}",
                "action": "LEAVE_APPROVED",
                "actor": lr.reviewed_by or "Admin",
                "target": lr.employee.name if lr.employee else "Employee",
                "details": f"Approved {lr.leave_type} ({lr.days} days) for {lr.start_date} to {lr.end_date}",
                "timestamp": lr.reviewed_at.isoformat() if lr.reviewed_at else lr.updated_at.isoformat(),
                "severity": "info",
            })
        elif lr.status == "REJECTED":
            logs.append({
                "id": f"audit-rej-{lr.id}",
                "action": "LEAVE_REJECTED",
                "actor": lr.reviewed_by or "Admin",
                "target": lr.employee.name if lr.employee else "Employee",
                "details": f"Rejected {lr.leave_type}. Reason: {lr.reason}",
                "timestamp": lr.reviewed_at.isoformat() if lr.reviewed_at else lr.updated_at.isoformat(),
                "severity": "warning",
            })
        else:
            logs.append({
                "id": f"audit-sub-{lr.id}",
                "action": "LEAVE_SUBMITTED",
                "actor": lr.employee.name if lr.employee else "Employee",
                "target": "Manager",
                "details": f"Submitted {lr.leave_type} request for {lr.days} days",
                "timestamp": lr.created_at.isoformat(),
                "severity": "neutral",
            })

    return logs

