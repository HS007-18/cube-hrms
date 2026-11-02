from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def _this_month() -> str:
    return datetime.now(IST).strftime("%Y-%m")


async def test_clock_in_is_idempotent_and_clock_out_computes_minutes(client, auth):
    headers = await auth("emp_a")

    first = await client.post("/attendance/clock-in", json={}, headers=headers)
    assert first.status_code == 200, first.text
    record_id = first.json()["record"]["id"]
    assert first.json()["message"] == "Clocked in"
    assert first.json()["record"]["clock_in"] is not None

    repeat = await client.post("/attendance/clock-in", json={}, headers=headers)
    assert repeat.status_code == 200
    assert repeat.json()["message"] == "Already clocked in today"
    assert repeat.json()["record"]["id"] == record_id

    out = await client.post("/attendance/clock-out", json={}, headers=headers)
    assert out.status_code == 200, out.text
    assert out.json()["record"]["clock_out"] is not None
    assert out.json()["record"]["work_minutes"] is not None

    duplicate = await client.post("/attendance/clock-out", json={}, headers=headers)
    assert duplicate.status_code == 409

    mine = await client.get(f"/attendance/me?month={_this_month()}", headers=headers)
    assert mine.status_code == 200
    assert len(mine.json()) == 1
    assert mine.json()[0]["id"] == record_id


async def test_clock_out_without_clock_in_is_rejected(client, auth):
    headers = await auth("emp_a")
    response = await client.post("/attendance/clock-out", json={}, headers=headers)
    assert response.status_code == 400


async def test_hr_sees_company_attendance_and_manager_sees_team_only(client, auth, world):
    employee = await auth("emp_a")
    await client.post("/attendance/clock-in", json={}, headers=employee)
    await client.post("/attendance/clock-in", json={}, headers=await auth("hr_a"))

    month = _this_month()
    hr_view = await client.get(f"/attendance?month={month}", headers=await auth("hr_a"))
    assert hr_view.status_code == 200
    visible = {item["employee_id"] for item in hr_view.json()}
    assert visible == {world["employees"]["emp_a"], world["employees"]["hr_a"]}

    manager_view = await client.get(
        f"/attendance?month={month}", headers=await auth("mgr_a")
    )
    assert manager_view.status_code == 200
    assert {item["employee_id"] for item in manager_view.json()} == {
        world["employees"]["emp_a"]
    }

    employee_view = await client.get(f"/attendance?month={month}", headers=employee)
    assert employee_view.status_code == 403

    invalid_month = await client.get("/attendance?month=2026-13", headers=await auth("hr_a"))
    assert invalid_month.status_code == 400


async def test_hr_can_correct_but_cross_tenant_correction_is_hidden(client, auth, world):
    employee = await auth("emp_a")
    record = (await client.post("/attendance/clock-in", json={}, headers=employee)).json()[
        "record"
    ]

    foreign = await client.patch(
        f"/attendance/{record['id']}",
        json={"status": "half_day", "notes": "tamper"},
        headers=await auth("hr_b"),
    )
    assert foreign.status_code == 404

    corrected = await client.patch(
        f"/attendance/{record['id']}",
        json={"status": "half_day", "notes": "Doctor visit"},
        headers=await auth("hr_a"),
    )
    assert corrected.status_code == 200
    assert corrected.json()["status"] == "half_day"
    assert corrected.json()["notes"] == "Doctor visit"
