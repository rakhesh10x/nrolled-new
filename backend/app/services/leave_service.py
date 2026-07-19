"""
Leave Management Business Logic Service.

Encapsulates business rules, validations, balance updates, and approval workflows:
    - Apply for leave (validates date ranges, past dates, overlap collisions, and balances)
    - Cancel pending leave requests
    - Admin approve leave (deducts balance, updates status, sets audit fields)
    - Admin reject leave (requires reason, sets audit fields)
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.exceptions import PermissionDeniedError, ResourceNotFoundError, ValidationError
from app.logging_config import log_event
from app.models import Employee, LeaveRequest, User
from app.repositories.leave_repository import LeaveRepository
from app.repositories.user_repository import UserRepository
from app.schemas import LeaveActionRequest, LeaveRequestCreate
from app.services.notification_service import NotificationService


class LeaveService:
    """Service class executing business logic for Leave Management."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.leave_repo = LeaveRepository(db)
        self.user_repo = UserRepository(db)

    def _parse_date(self, date_str: str) -> datetime:
        """Parse YYYY-MM-DD string into datetime."""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValidationError(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.")

    def apply_leave(self, current_user: User, payload: LeaveRequestCreate) -> LeaveRequest:
        """
        Apply for a new leave request.

        Validations:
            1. Employee record exists and is active
            2. Start date <= End date
            3. Start date is not in the past
            4. No overlapping active leave requests
            5. Sufficient leave balance for requested leave type
        """
        if not current_user.employee_id:
            raise ValidationError("User is not associated with an employee record.")

        employee = self.user_repo.get_employee_by_user_id(current_user.id)
        if not employee:
            raise ResourceNotFoundError("Employee", current_user.employee_id)

        # 1. Date Range Validation
        start_dt = self._parse_date(payload.start_date)
        end_dt = self._parse_date(payload.end_date)

        if start_dt > end_dt:
            raise ValidationError("Leave start date cannot be after end date.")

        today_dt = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if start_dt < today_dt:
            raise ValidationError("Leave start date cannot be in the past.")

        # Calculate calendar days
        requested_days = (end_dt - start_dt).days + 1

        # 2. Check Overlapping Active Leaves
        overlap = self.leave_repo.get_overlapping_leave(
            employee_id=employee.id,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
        if overlap:
            raise ValidationError(
                f"You already have a active {overlap.status} leave request ({overlap.start_date} to {overlap.end_date}) overlapping these dates."
            )

        # 3. Check Leave Balance
        leave_type = payload.leave_type.strip()
        remaining_cl = max(0, 12 - employee.casual_leave_used)
        remaining_sl = max(0, 12 - employee.sick_leave_used)
        remaining_el = max(0, 18 - employee.earned_leave_used)

        if "casual" in leave_type.lower():
            if requested_days > remaining_cl:
                raise ValidationError(
                    f"Insufficient Casual Leave balance. Requested: {requested_days} days, Available: {remaining_cl} days."
                )
        elif "sick" in leave_type.lower():
            if requested_days > remaining_sl:
                raise ValidationError(
                    f"Insufficient Sick Leave balance. Requested: {requested_days} days, Available: {remaining_sl} days."
                )
        elif "earned" in leave_type.lower() or "privilege" in leave_type.lower():
            if requested_days > remaining_el:
                raise ValidationError(
                    f"Insufficient Earned Leave balance. Requested: {requested_days} days, Available: {remaining_el} days."
                )

        # 4. Create Leave Request
        leave = LeaveRequest(
            employee_id=employee.id,
            leave_type=leave_type,
            start_date=payload.start_date,
            end_date=payload.end_date,
            days=requested_days,
            reason=payload.reason,
            status="PENDING",
            created_by=employee.name,
        )
        saved_leave = self.leave_repo.create(leave)

        # Notification & Log
        NotificationService.push_notification(
            user_id=current_user.id,
            event_type="LEAVE_APPLIED",
            title="Leave Request Submitted",
            message=f"Your {leave_type} request for {requested_days} day(s) has been submitted for approval.",
        )
        log_event(
            "leave_applied",
            {
                "employee_id": employee.emp_id,
                "leave_uuid": saved_leave.uuid,
                "leave_type": leave_type,
                "days": requested_days,
            },
            level="info",
        )

        return saved_leave

    def cancel_leave(self, current_user: User, leave_uuid: str) -> LeaveRequest:
        """Cancel a pending leave request owned by the current user."""
        leave = self.leave_repo.get_by_uuid(leave_uuid)
        if not leave:
            raise ResourceNotFoundError("LeaveRequest", leave_uuid)

        if leave.employee_id != current_user.employee_id:
            raise PermissionDeniedError("You can only cancel your own leave requests.")

        if leave.status != "PENDING":
            raise ValidationError(f"Cannot cancel a leave request that is already {leave.status}.")

        leave.status = "CANCELLED"
        self.db.commit()

        log_event("leave_cancelled", {"leave_uuid": leave_uuid, "username": current_user.username}, level="info")
        return leave

    def approve_leave(self, admin_user: User, leave_uuid: str) -> LeaveRequest:
        """
        Approve a pending leave request (Admin action).
        Deducts the leave balance on the employee record and sets audit trail fields.
        """
        leave = self.leave_repo.get_by_uuid(leave_uuid)
        if not leave:
            raise ResourceNotFoundError("LeaveRequest", leave_uuid)

        if leave.status != "PENDING":
            raise ValidationError(f"Cannot approve a leave request that is already {leave.status}.")

        employee = leave.employee

        # Deduct balance based on type
        leave_type_lower = leave.leave_type.lower()
        if "casual" in leave_type_lower:
            employee.casual_leave_used += leave.days
        elif "sick" in leave_type_lower:
            employee.sick_leave_used += leave.days
        elif "earned" in leave_type_lower or "privilege" in leave_type_lower:
            employee.earned_leave_used += leave.days

        # Update Leave Request status & audit fields
        leave.status = "APPROVED"
        leave.reviewed_by = admin_user.username
        leave.reviewed_at = datetime.now(timezone.utc)

        self.db.commit()

        # Push Notification
        user_recipient = self.db.query(User).filter_by(employee_id=employee.id).first()
        if user_recipient:
            NotificationService.push_notification(
                user_id=user_recipient.id,
                event_type="LEAVE_APPROVED",
                title="Leave Approved",
                message=f"Your {leave.leave_type} request ({leave.start_date} to {leave.end_date}) was approved by {admin_user.username}.",
            )

        log_event(
            "leave_approved",
            {
                "leave_uuid": leave_uuid,
                "approved_by": admin_user.username,
                "employee_emp_id": employee.emp_id,
                "days": leave.days,
            },
            level="info",
        )

        return leave

    def reject_leave(
        self, admin_user: User, leave_uuid: str, payload: LeaveActionRequest
    ) -> LeaveRequest:
        """Reject a pending leave request with a mandatory reason."""
        leave = self.leave_repo.get_by_uuid(leave_uuid)
        if not leave:
            raise ResourceNotFoundError("LeaveRequest", leave_uuid)

        if leave.status != "PENDING":
            raise ValidationError(f"Cannot reject a leave request that is already {leave.status}.")

        reason = payload.reason.strip() if payload.reason else ""
        if not reason:
            raise ValidationError("A rejection reason is required when rejecting leave requests.")

        leave.status = "REJECTED"
        leave.reviewed_by = admin_user.username
        leave.reviewed_at = datetime.now(timezone.utc)
        leave.reason = f"{leave.reason} | Rejection Reason: {reason}"

        self.db.commit()

        # Push Notification
        user_recipient = self.db.query(User).filter_by(employee_id=leave.employee.id).first()
        if user_recipient:
            NotificationService.push_notification(
                user_id=user_recipient.id,
                event_type="LEAVE_REJECTED",
                title="Leave Request Rejected",
                message=f"Your {leave.leave_type} request was rejected: {reason}",
            )

        log_event(
            "leave_rejected",
            {
                "leave_uuid": leave_uuid,
                "rejected_by": admin_user.username,
                "reason": reason,
            },
            level="info",
        )

        return leave
