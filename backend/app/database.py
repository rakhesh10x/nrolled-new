"""
Database Connection and Session Management.

Provides SQLAlchemy engine, session maker, and FastAPI dependency (`get_db`)
for managing database transactions cleanly per request lifecycle.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# Engine creation
# connect_args={"check_same_thread": False} is required for SQLite in multi-threaded FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base ORM class for all SQLAlchemy 2.0 models."""

    pass


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per HTTP request.
    Ensures session is closed at the end of the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables on application startup."""
    Base.metadata.create_all(bind=engine)
