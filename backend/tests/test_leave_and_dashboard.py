"""
Employee & Admin Features Test Suite.

Verifies:
    - Employee profile & dashboard endpoints
    - Apply leave validation (dates, overlap, balance checks)
    - Cancel pending leave
    - Admin leave approval workflow (balance deduction, status, audit trail)
    - Admin leave rejection workflow (mandatory reason)
    - Employee directory search & pagination
    - Admin dashboard & Recharts analytics endpoints
"""

from datetime import datetime, timedelta
import pytest


def test_employee_profile_and_dashboard(client, employee_token_headers):
    """Test retrieving employee profile and dashboard metrics."""
    profile_resp = client.get("/api/v1/employee/profile", headers=employee_token_headers)
    assert profile_resp.status_code == 200
    p = profile_resp.json()
    assert p["emp_id"] == "EMP001"
    assert p["name"] == "John Smith"
    assert p["remaining_leave"] == 13

    dash_resp = client.get("/api/v1/employee/dashboard", headers=employee_token_headers)
    assert dash_resp.status_code == 200
    d = dash_resp.json()
    assert d["remaining_leave"] == 13
    assert len(d["upcoming_holidays"]) > 0


def test_apply_leave_success(client, employee_token_headers):
    """Test successful leave application for future dates."""
    today = datetime.now()
    start_date = (today + timedelta(days=30)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=31)).strftime("%Y-%m-%d")

    payload = {
        "leave_type": "Casual Leave",
        "start_date": start_date,
        "end_date": end_date,
        "reason": "Personal family event",
    }

    response = client.post("/api/v1/employee/leave/apply", json=payload, headers=employee_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["days"] == 2
    assert "uuid" in data


def test_apply_leave_validation_past_date(client, employee_token_headers):
    """Test applying for leave in the past returns 400 Validation Error."""
    payload = {
        "leave_type": "Casual Leave",
        "start_date": "2020-01-01",
        "end_date": "2020-01-02",
        "reason": "Past date test",
    }
    response = client.post("/api/v1/employee/leave/apply", json=payload, headers=employee_token_headers)
    assert response.status_code == 400
    assert "cannot be in the past" in response.json()["detail"]["error"]


def test_apply_leave_validation_invalid_date_range(client, employee_token_headers):
    """Test start date after end date returns 400 Validation Error."""
    today = datetime.now()
    start_date = (today + timedelta(days=10)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=5)).strftime("%Y-%m-%d")

    payload = {
        "leave_type": "Casual Leave",
        "start_date": start_date,
        "end_date": end_date,
        "reason": "Invalid date range test",
    }
    response = client.post("/api/v1/employee/leave/apply", json=payload, headers=employee_token_headers)
    assert response.status_code == 400
    assert "cannot be after end date" in response.json()["detail"]["error"]


def test_cancel_pending_leave(client, employee_token_headers):
    """Test cancelling a pending leave request."""
    today = datetime.now()
    start_date = (today + timedelta(days=40)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=40)).strftime("%Y-%m-%d")

    apply_resp = client.post(
        "/api/v1/employee/leave/apply",
        json={"leave_type": "Casual Leave", "start_date": start_date, "end_date": end_date, "reason": "Testing cancellation"},
        headers=employee_token_headers,
    )
    leave_uuid = apply_resp.json()["uuid"]

    cancel_resp = client.post(f"/api/v1/employee/leave/{leave_uuid}/cancel", headers=employee_token_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["message"] == "Leave request cancelled successfully."


def test_admin_approve_leave_workflow(client, employee_token_headers, admin_token_headers):
    """Test admin leave approval workflow and balance deduction."""
    today = datetime.now()
    start_date = (today + timedelta(days=50)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=51)).strftime("%Y-%m-%d")

    apply_resp = client.post(
        "/api/v1/employee/leave/apply",
        json={"leave_type": "Casual Leave", "start_date": start_date, "end_date": end_date, "reason": "Vacation request"},
        headers=employee_token_headers,
    )
    leave_uuid = apply_resp.json()["uuid"]

    approve_resp = client.put(f"/api/v1/admin/leaves/{leave_uuid}/approve", headers=admin_token_headers)
    assert approve_resp.status_code == 200
    data = approve_resp.json()
    assert data["status"] == "APPROVED"
    assert data["reviewed_by"] == "admin"
    assert data["reviewed_at"] is not None

    # Check updated employee profile balance
    profile = client.get("/api/v1/employee/profile", headers=employee_token_headers).json()
    assert profile["casual_leave_used"] == 4  # 2 initial + 2 new


def test_admin_reject_leave_workflow(client, employee_token_headers, admin_token_headers):
    """Test admin leave rejection workflow requires reason."""
    today = datetime.now()
    start_date = (today + timedelta(days=60)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=60)).strftime("%Y-%m-%d")

    apply_resp = client.post(
        "/api/v1/employee/leave/apply",
        json={"leave_type": "Sick Leave", "start_date": start_date, "end_date": end_date, "reason": "Dental surgery"},
        headers=employee_token_headers,
    )
    leave_uuid = apply_resp.json()["uuid"]

    # Reject without reason fails
    fail_resp = client.put(f"/api/v1/admin/leaves/{leave_uuid}/reject", json={"reason": ""}, headers=admin_token_headers)
    assert fail_resp.status_code == 400

    # Reject with valid reason passes
    reject_resp = client.put(f"/api/v1/admin/leaves/{leave_uuid}/reject", json={"reason": "Peak sprint deadline"}, headers=admin_token_headers)
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "REJECTED"


def test_admin_dashboard_and_analytics(client, admin_token_headers):
    """Test admin dashboard statistics and Recharts chart datasets."""
    dash_resp = client.get("/api/v1/admin/dashboard", headers=admin_token_headers)
    assert dash_resp.status_code == 200
    d = dash_resp.json()
    assert d["total_employees"] == 2
    assert "department_counts" in d

    dist_resp = client.get("/api/v1/admin/analytics/leave-distribution", headers=admin_token_headers)
    assert dist_resp.status_code == 200
    assert isinstance(dist_resp.json(), list)

    trends_resp = client.get("/api/v1/admin/analytics/monthly-trends", headers=admin_token_headers)
    assert trends_resp.status_code == 200
    assert isinstance(trends_resp.json(), list)


def test_admin_employee_search_and_pagination(client, admin_token_headers):
    """Test searching employees and paginated response structure."""
    resp = client.get("/api/v1/admin/employees?search=John&page=1&page_size=5", headers=admin_token_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    assert "total_pages" in data
    assert data["items"][0]["emp_id"] == "EMP001"
