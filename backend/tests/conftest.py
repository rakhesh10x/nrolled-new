"""
Pytest Fixtures for HR Assistant Backend Testing.

Provides:
    - Isolated in-memory SQLite database with StaticPool
    - FastAPI TestClient with DB overrides
    - Pre-seeded test users (employee & admin)
    - Valid JWT authorization headers
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import create_access_token, hash_password
from app.database import Base, get_db
import app.database as app_db
from app.main import app
from app.models import Employee, User

# In-memory SQLite engine with StaticPool so all connections share the same memory DB
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database module engine and SessionLocal for testing
app_db.engine = engine
app_db.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for each test and tear down after."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed test employee
    emp_employee = Employee(
        emp_id="EMP001",
        name="John Smith",
        email="john.smith@techcorp.com",
        department="Engineering",
        designation="Senior Software Engineer",
        manager="David Wilson",
        salary=50000.0,
        attendance_pct=96.0,
        annual_leave=18,
        casual_leave_used=2,
        sick_leave_used=1,
        earned_leave_used=2,
        date_of_joining="2023-03-15",
    )
    db.add(emp_employee)

    # Seed test admin employee
    emp_admin = Employee(
        emp_id="EMP007",
        name="Vikram Singh",
        email="vikram.singh@techcorp.com",
        department="HR",
        designation="HR Coordinator",
        manager="Neha Gupta",
        salary=35000.0,
        attendance_pct=99.0,
        annual_leave=18,
        casual_leave_used=1,
        sick_leave_used=0,
        earned_leave_used=0,
        date_of_joining="2022-06-15",
    )
    db.add(emp_admin)
    db.commit()

    # Seed test users
    user_emp = User(
        username="employee",
        password_hash=hash_password("employee123"),
        role="employee",
        employee_id=emp_employee.id,
    )

    user_adm = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role="admin",
        employee_id=emp_admin.id,
    )
    db.add(user_emp)
    db.add(user_adm)
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session):
    """FastAPI TestClient with overridden get_db dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def employee_token_headers():
    """Header dict with valid employee JWT."""
    token = create_access_token({"sub": "employee", "role": "employee", "user_id": 1})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_token_headers():
    """Header dict with valid admin JWT."""
    token = create_access_token({"sub": "admin", "role": "admin", "user_id": 2})
    return {"Authorization": f"Bearer {token}"}
