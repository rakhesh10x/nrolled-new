"""
Chat Repository.

Manages persistence of chat sessions and conversation message history in SQLite.
"""

import json
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models import ChatMessage, ChatSession


class ChatRepository:
    """Repository class for ChatSession and ChatMessage database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create_session(self, user_id: int, title: str = "New Chat") -> ChatSession:
        """Create a new chat session for a user."""
        session = ChatSession(user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session_by_uuid(self, session_uuid: str, user_id: int) -> Optional[ChatSession]:
        """Fetch active session by public UUID belonging to a user."""
        return (
            self.db.query(ChatSession)
            .filter(
                ChatSession.uuid == session_uuid,
                ChatSession.user_id == user_id,
                ChatSession.deleted_at.is_(None),
            )
            .first()
        )

    def list_user_sessions(self, user_id: int) -> List[ChatSession]:
        """Fetch all active chat sessions for a user, ordered by latest updated."""
        return (
            self.db.query(ChatSession)
            .options(joinedload(ChatSession.messages))
            .filter(ChatSession.user_id == user_id, ChatSession.deleted_at.is_(None))
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    def delete_session(self, session_uuid: str, user_id: int) -> bool:
        """Soft-delete a chat session."""
        session = self.get_session_by_uuid(session_uuid, user_id)
        if session:
            from datetime import datetime, timezone
            session.deleted_at = datetime.now(timezone.utc)
            self.db.commit()
            return True
        return False

    def add_message(
        self,
        session_id: int,
        role: str,
        content: str,
        sources: Optional[List[str]] = None,
    ) -> ChatMessage:
        """Add a message to a chat session and touch the session updated_at timestamp."""
        sources_json = json.dumps(sources) if sources else None
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sources_json=sources_json,
        )
        self.db.add(msg)

        # Update parent session updated_at
        session = self.db.query(ChatSession).get(session_id)
        if session:
            from datetime import datetime, timezone
            session.updated_at = datetime.now(timezone.utc)
            # Auto-title if it's the first user message
            if session.title == "New Chat" and role == "user":
                session.title = content[:30] + ("…" if len(content) > 30 else "")

        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_recent_messages(self, session_id: int, limit: int = 10) -> List[ChatMessage]:
        """Fetch the last N messages for conversation memory context window."""
        return (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()[-limit:]
        )
