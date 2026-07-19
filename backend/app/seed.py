"""
Database Seeder Script.

Populates initial realistic demo data into SQLite:
    - 10 Employees across multiple departments (Engineering, Product, Design, Marketing, HR, Finance, Sales)
    - 2 Users: employee (EMP001) and admin (EMP007)
    - 20 Leave Requests with varied statuses (APPROVED, PENDING, REJECTED) and audit fields
"""

from datetime import datetime, timedelta, timezone
import bcrypt
from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models import Employee, LeaveRequest, User


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def seed_database(db: Session) -> None:
    """Populate database with demo employees, users, and leave requests."""

    # 1. Check if database is already seeded
    if db.query(Employee).count() > 0:
        print("[SEED] Database already contains data. Skipping seeding.")
        return

    print("[SEED] Seeding database with production-quality demo data...")

    # ---------------------------------------------------------------------------
    # 2. Create 10 Employees
    # ---------------------------------------------------------------------------
    employees_data = [
        {
            "emp_id": "EMP001",
            "name": "John Smith",
            "email": "john.smith@techcorp.com",
            "department": "Engineering",
            "designation": "Senior Software Engineer",
            "manager": "David Wilson",
            "salary": 50000.00,
            "attendance_pct": 96.0,
            "annual_leave": 18,
            "casual_leave_used": 2,
            "sick_leave_used": 1,
            "earned_leave_used": 2,
            "date_of_joining": "2023-03-15",
        },
        {
            "emp_id": "EMP002",
            "name": "Priya Sharma",
            "email": "priya.sharma@techcorp.com",
            "department": "Engineering",
            "designation": "Software Engineer",
            "manager": "David Wilson",
            "salary": 42000.00,
            "attendance_pct": 94.0,
            "annual_leave": 18,
            "casual_leave_used": 4,
            "sick_leave_used": 2,
            "earned_leave_used": 2,
            "date_of_joining": "2023-08-01",
        },
        {
            "emp_id": "EMP003",
            "name": "Rahul Verma",
            "email": "rahul.verma@techcorp.com",
            "department": "Product",
            "designation": "Product Manager",
            "manager": "Anita Desai",
            "salary": 55000.00,
            "attendance_pct": 98.0,
            "annual_leave": 18,
            "casual_leave_used": 1,
            "sick_leave_used": 1,
            "earned_leave_used": 1,
            "date_of_joining": "2022-11-10",
        },
        {
            "emp_id": "EMP004",
            "name": "Sarah Johnson",
            "email": "sarah.johnson@techcorp.com",
            "department": "Design",
            "designation": "UI/UX Designer",
            "manager": "Anita Desai",
            "salary": 45000.00,
            "attendance_pct": 92.0,
            "annual_leave": 18,
            "casual_leave_used": 5,
            "sick_leave_used": 3,
            "earned_leave_used": 2,
            "date_of_joining": "2024-01-15",
        },
        {
            "emp_id": "EMP005",
            "name": "Amit Patel",
            "email": "amit.patel@techcorp.com",
            "department": "Engineering",
            "designation": "DevOps Engineer",
            "manager": "David Wilson",
            "salary": 48000.00,
            "attendance_pct": 97.0,
            "annual_leave": 18,
            "casual_leave_used": 1,
            "sick_leave_used": 0,
            "earned_leave_used": 1,
            "date_of_joining": "2023-05-20",
        },
        {
            "emp_id": "EMP006",
            "name": "Emily Chen",
            "email": "emily.chen@techcorp.com",
            "department": "Marketing",
            "designation": "Marketing Specialist",
            "manager": "Neha Gupta",
            "salary": 38000.00,
            "attendance_pct": 91.0,
            "annual_leave": 18,
            "casual_leave_used": 3,
            "sick_leave_used": 2,
            "earned_leave_used": 2,
            "date_of_joining": "2024-02-01",
        },
        {
            "emp_id": "EMP007",
            "name": "Vikram Singh",
            "email": "vikram.singh@techcorp.com",
            "department": "HR",
            "designation": "HR Coordinator",
            "manager": "Neha Gupta",
            "salary": 35000.00,
            "attendance_pct": 99.0,
            "annual_leave": 18,
            "casual_leave_used": 1,
            "sick_leave_used": 0,
            "earned_leave_used": 0,
            "date_of_joining": "2022-06-15",
        },
        {
            "emp_id": "EMP008",
            "name": "Lisa Wang",
            "email": "lisa.wang@techcorp.com",
            "department": "Finance",
            "designation": "Financial Analyst",
            "manager": "Rajesh Kumar",
            "salary": 46000.00,
            "attendance_pct": 95.0,
            "annual_leave": 18,
            "casual_leave_used": 2,
            "sick_leave_used": 2,
            "earned_leave_used": 2,
            "date_of_joining": "2023-09-10",
        },
        {
            "emp_id": "EMP009",
            "name": "Arjun Reddy",
            "email": "arjun.reddy@techcorp.com",
            "department": "Engineering",
            "designation": "QA Engineer",
            "manager": "David Wilson",
            "salary": 40000.00,
            "attendance_pct": 93.0,
            "annual_leave": 18,
            "casual_leave_used": 4,
            "sick_leave_used": 3,
            "earned_leave_used": 2,
            "date_of_joining": "2023-10-01",
        },
        {
            "emp_id": "EMP010",
            "name": "Maria Garcia",
            "email": "maria.garcia@techcorp.com",
            "department": "Sales",
            "designation": "Sales Executive",
            "manager": "Rajesh Kumar",
            "salary": 37000.00,
            "attendance_pct": 90.0,
            "annual_leave": 18,
            "casual_leave_used": 2,
            "sick_leave_used": 1,
            "earned_leave_used": 1,
            "date_of_joining": "2024-03-01",
        },
    ]

    employees = []
    for emp_dict in employees_data:
        emp = Employee(**emp_dict)
        db.add(emp)
        employees.append(emp)

    db.commit()

    # Re-query to get IDs
    emp_map = {e.emp_id: e for e in db.query(Employee).all()}

    # ---------------------------------------------------------------------------
    # 3. Create Demo Users (employee & admin)
    # ---------------------------------------------------------------------------
    user_employee = User(
        username="employee",
        password_hash=hash_password("employee123"),
        role="employee",
        employee_id=emp_map["EMP001"].id,
    )

    user_admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role="admin",
        employee_id=emp_map["EMP007"].id,  # Vikram Singh (HR)
    )

    db.add(user_employee)
    db.add(user_admin)
    db.commit()

    # ---------------------------------------------------------------------------
    # 4. Create 20 Leave Requests
    # ---------------------------------------------------------------------------
    now_utc = datetime.now(timezone.utc)

    requests_data = [
        # Employee 1 (John Smith)
        {"emp_id": "EMP001", "type": "Casual Leave", "start": "2026-05-10", "end": "2026-05-11", "days": 2, "status": "APPROVED", "reason": "Personal work at home", "reviewer": "admin"},
        {"emp_id": "EMP001", "type": "Sick Leave", "start": "2026-06-14", "end": "2026-06-14", "days": 1, "status": "APPROVED", "reason": "Fever and rest", "reviewer": "admin"},
        {"emp_id": "EMP001", "type": "Earned Leave", "start": "2026-07-01", "end": "2026-07-02", "days": 2, "status": "APPROVED", "reason": "Summer vacation trip", "reviewer": "admin"},
        {"emp_id": "EMP001", "type": "Casual Leave", "start": "2026-08-10", "end": "2026-08-12", "days": 3, "status": "PENDING", "reason": "Family event in hometown", "reviewer": None},

        # Employee 2 (Priya Sharma)
        {"emp_id": "EMP002", "type": "Casual Leave", "start": "2026-04-12", "end": "2026-04-15", "days": 4, "status": "APPROVED", "reason": "Family emergency", "reviewer": "admin"},
        {"emp_id": "EMP002", "type": "Sick Leave", "start": "2026-05-18", "end": "2026-05-19", "days": 2, "status": "APPROVED", "reason": "Medical checkup", "reviewer": "admin"},
        {"emp_id": "EMP002", "type": "Earned Leave", "start": "2026-07-20", "end": "2026-07-21", "days": 2, "status": "PENDING", "reason": "Personal vacation", "reviewer": None},

        # Employee 3 (Rahul Verma)
        {"emp_id": "EMP003", "type": "Earned Leave", "start": "2026-03-01", "end": "2026-03-01", "days": 1, "status": "APPROVED", "reason": "Product conference", "reviewer": "admin"},
        {"emp_id": "EMP003", "type": "Casual Leave", "start": "2026-06-05", "end": "2026-06-05", "days": 1, "status": "APPROVED", "reason": "Home relocation", "reviewer": "admin"},
        {"emp_id": "EMP003", "type": "Sick Leave", "start": "2026-07-22", "end": "2026-07-22", "days": 1, "status": "PENDING", "reason": "Dental appointment", "reviewer": None},

        # Employee 4 (Sarah Johnson)
        {"emp_id": "EMP004", "type": "Casual Leave", "start": "2026-02-14", "end": "2026-02-18", "days": 5, "status": "APPROVED", "reason": "Family vacation", "reviewer": "admin"},
        {"emp_id": "EMP004", "type": "Sick Leave", "start": "2026-04-01", "end": "2026-04-03", "days": 3, "status": "APPROVED", "reason": "Flu recovery", "reviewer": "admin"},
        {"emp_id": "EMP004", "type": "Earned Leave", "start": "2026-06-10", "end": "2026-06-11", "days": 2, "status": "REJECTED", "reason": "Design sprint delivery conflict", "reviewer": "admin"},

        # Employee 5 (Amit Patel)
        {"emp_id": "EMP005", "type": "Casual Leave", "start": "2026-05-02", "end": "2026-05-02", "days": 1, "status": "APPROVED", "reason": "Vehicle registration", "reviewer": "admin"},
        {"emp_id": "EMP005", "type": "Earned Leave", "start": "2026-07-25", "end": "2026-07-25", "days": 1, "status": "PENDING", "reason": "DevOps certification exam", "reviewer": None},

        # Employee 6 (Emily Chen)
        {"emp_id": "EMP006", "type": "Casual Leave", "start": "2026-03-10", "end": "2026-03-12", "days": 3, "status": "APPROVED", "reason": "Personal matters", "reviewer": "admin"},
        {"emp_id": "EMP006", "type": "Sick Leave", "start": "2026-05-20", "end": "2026-05-21", "days": 2, "status": "APPROVED", "reason": "Viral fever", "reviewer": "admin"},

        # Employee 8 (Lisa Wang)
        {"emp_id": "EMP008", "type": "Casual Leave", "start": "2026-04-05", "end": "2026-04-06", "days": 2, "status": "APPROVED", "reason": "Financial audit rest", "reviewer": "admin"},
        {"emp_id": "EMP008", "type": "Earned Leave", "start": "2026-08-01", "end": "2026-08-02", "days": 2, "status": "PENDING", "reason": "Extended weekend trip", "reviewer": None},

        # Employee 9 (Arjun Reddy)
        {"emp_id": "EMP009", "type": "Casual Leave", "start": "2026-06-20", "end": "2026-06-23", "days": 4, "status": "APPROVED", "reason": "Hometown festival", "reviewer": "admin"},

        # Employee 10 (Maria Garcia)
        {"emp_id": "EMP010", "type": "Sick Leave", "start": "2026-07-15", "end": "2026-07-15", "days": 1, "status": "REJECTED", "reason": "High sales volume week requirement", "reviewer": "admin"},
    ]

    for req in requests_data:
        emp = emp_map[req["emp_id"]]
        leave_req = LeaveRequest(
            employee_id=emp.id,
            leave_type=req["type"],
            start_date=req["start"],
            end_date=req["end"],
            days=req["days"],
            reason=req["reason"],
            status=req["status"],
            created_by=emp.name,
            reviewed_by=req["reviewer"],
            reviewed_at=now_utc if req["reviewer"] else None,
        )
        db.add(leave_req)

    db.commit()
    print("[SEED] Database successfully seeded with 10 employees, 2 users, and 20 leave requests!")


if __name__ == "__main__":
    init_db()
    session = SessionLocal()
    try:
        seed_database(session)
    finally:
        session.close()
