"""
Notification Service.

Generates and stores in-memory toast notification events for backend actions
(leave applied, leave approved, leave rejected).
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class NotificationEvent(BaseModel):
    """Backend notification event schema."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: int
    event_type: str  # LEAVE_APPLIED, LEAVE_APPROVED, LEAVE_REJECTED
    title: str
    message: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NotificationService:
    """In-memory event store for toast notifications."""

    _notifications: List[NotificationEvent] = []

    @classmethod
    def push_notification(
        cls,
        user_id: int,
        event_type: str,
        title: str,
        message: str,
    ) -> NotificationEvent:
        """Create and record a notification event."""
        event = NotificationEvent(
            user_id=user_id,
            event_type=event_type,
            title=title,
            message=message,
        )
        cls._notifications.append(event)
        return event

    @classmethod
    def get_user_notifications(cls, user_id: int) -> List[NotificationEvent]:
        """Fetch unread notification events for a user."""
        return [n for n in cls._notifications if n.user_id == user_id and not n.read]

    @classmethod
    def mark_as_read(cls, notification_id: str) -> None:
        """Mark a notification event as read."""
        for n in cls._notifications:
            if n.id == notification_id:
                n.read = True
                break
