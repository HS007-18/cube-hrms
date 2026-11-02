from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


async def test_hr_dashboard_metrics(client, auth, world):
    employee = await auth("emp_a")
    await client.post(
        "/leave/requests",
        json={
            "leave_type_id": world["leave_types"]["alpha"],
            "from_date": "2027-09-06",
            "to_date": "2027-09-07",
            "reason": "Personal",
        },
        headers=employee,
    )

    response = await client.get("/dashboard/summary", headers=await auth("hr_a"))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "hr_admin"
    assert body["date"] == datetime.now(IST).date().isoformat()
    metrics = {metric["key"]: metric["value"] for metric in body["metrics"]}
    assert metrics["headcount"] == 3
    assert metrics["pending_approvals"] == 1
    assert metrics["present_today"] == 0
    assert metrics["on_leave"] == 0


async def test_manager_dashboard_counts_direct_reports(client, auth, world):
    employee = await auth("emp_a")
    await client.post("/attendance/clock-in", json={}, headers=employee)
    await client.post(
        "/leave/requests",
        json={
            "leave_type_id": world["leave_types"]["alpha"],
            "from_date": "2027-10-04",
            "to_date": "2027-10-05",
            "reason": "Personal",
        },
        headers=employee,
    )

    response = await client.get("/dashboard/summary", headers=await auth("mgr_a"))
    assert response.status_code == 200
    metrics = {metric["key"]: metric["value"] for metric in response.json()["metrics"]}
    assert metrics["team_size"] == 1
    assert metrics["team_present"] == 1
    assert metrics["team_pending"] == 1


async def test_employee_dashboard_and_tenant_isolation(client, auth):
    response = await client.get("/dashboard/summary", headers=await auth("emp_a"))
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "employee"
    assert {metric["key"] for metric in body["metrics"]} == {
        "present_days",
        "leave_remaining",
        "my_pending",
        "headcount",
    }
    assert {metric["key"]: metric["value"] for metric in body["metrics"]}["headcount"] == 3

    beta = await client.get("/dashboard/summary", headers=await auth("hr_b"))
    beta_metrics = {metric["key"]: metric["value"] for metric in beta.json()["metrics"]}
    assert beta_metrics["headcount"] == 1
