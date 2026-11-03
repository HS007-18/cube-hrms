from decimal import Decimal

# Fixed weekday ranges keep the business-day math deterministic.
RANGE_A = ("2027-03-01", "2027-03-02")  # Mon-Tue, 2 days
RANGE_B = ("2027-05-03", "2027-05-04")  # Mon-Tue, 2 days
RANGE_C = ("2027-06-07", "2027-06-08")  # Mon-Tue, 2 days
RANGE_D = ("2027-07-05", "2027-07-06")  # Mon-Tue, 2 days
RANGE_LONG = ("2027-04-05", "2027-04-30")  # 20 weekdays, over quota


async def _apply(client, headers, leave_type_id, start, end, reason="Family event"):
    return await client.post(
        "/leave/requests",
        json={
            "leave_type_id": leave_type_id,
            "from_date": start,
            "to_date": end,
            "reason": reason,
        },
        headers=headers,
    )


async def _balance(client, headers, leave_type_id, year=2027):
    response = await client.get(f"/leave/balances?year={year}", headers=headers)
    assert response.status_code == 200, response.text
    for row in response.json():
        if row["leave_type_id"] == leave_type_id:
            return Decimal(row["used_days"]), Decimal(row["remaining_days"])
    raise AssertionError("leave type not returned")


async def test_apply_approve_and_cancel_refunds_balance(client, auth, world):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")
    leave_type = world["leave_types"]["alpha"]

    assert await _balance(client, employee, leave_type) == (Decimal("0.0"), Decimal("12.0"))

    applied = await _apply(client, employee, leave_type, *RANGE_A)
    assert applied.status_code == 201, applied.text
    body = applied.json()
    assert Decimal(body["days"]) == Decimal("2.0")
    assert body["status"] == "pending"
    request_id = body["id"]

    approved = await client.post(
        f"/leave/requests/{request_id}/approve",
        json={"comment": "Enjoy"},
        headers=manager,
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"
    assert await _balance(client, employee, leave_type) == (Decimal("2.0"), Decimal("10.0"))

    repeat = await client.post(f"/leave/requests/{request_id}/approve", headers=manager)
    assert repeat.status_code == 409

    cancelled = await client.post(f"/leave/requests/{request_id}/cancel", headers=employee)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert await _balance(client, employee, leave_type) == (Decimal("0.0"), Decimal("12.0"))


async def test_denial_requires_a_reason(client, auth, world):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")
    request_id = (await _apply(client, employee, world["leave_types"]["alpha"], *RANGE_B)).json()[
        "id"
    ]

    empty = await client.post(
        f"/leave/requests/{request_id}/deny", json={"comment": "   "}, headers=manager
    )
    assert empty.status_code == 400

    denied = await client.post(
        f"/leave/requests/{request_id}/deny",
        json={"comment": "Peak production week"},
        headers=manager,
    )
    assert denied.status_code == 200
    assert denied.json()["status"] == "denied"
    assert denied.json()["review_comment"] == "Peak production week"


async def test_overlap_and_insufficient_balance_are_rejected(client, auth, world):
    employee = await auth("emp_a")
    leave_type = world["leave_types"]["alpha"]

    assert (await _apply(client, employee, leave_type, *RANGE_C)).status_code == 201
    overlap = await _apply(client, employee, leave_type, "2027-06-08", "2027-06-09")
    assert overlap.status_code == 409

    long = await _apply(client, employee, leave_type, *RANGE_LONG)
    assert long.status_code == 400
    assert "Insufficient balance" in long.json()["detail"]


async def test_cross_year_and_weekend_only_ranges_are_rejected(client, auth, world):
    employee = await auth("emp_a")
    leave_type = world["leave_types"]["alpha"]

    cross_year = await _apply(client, employee, leave_type, "2026-12-31", "2027-01-01")
    assert cross_year.status_code == 400

    weekend = await _apply(client, employee, leave_type, "2027-03-06", "2027-03-07")
    assert weekend.status_code == 400


async def test_review_authorization_boundaries(client, auth, world):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")
    hr = await auth("hr_a")
    foreign_hr = await auth("hr_b")

    # Managers only review direct reports.
    own_request = await _apply(client, hr, world["leave_types"]["alpha"], *RANGE_C)
    assert own_request.status_code == 201
    manager_cannot = await client.post(
        f"/leave/requests/{own_request.json()['id']}/approve", headers=manager
    )
    assert manager_cannot.status_code == 403

    # Employees cannot review anything.
    employee_cannot = await client.post(
        f"/leave/requests/{own_request.json()['id']}/approve", headers=employee
    )
    assert employee_cannot.status_code == 403

    # A same-role admin in another tenant cannot even see the request.
    foreign = await client.post(
        f"/leave/requests/{own_request.json()['id']}/approve", headers=foreign_hr
    )
    assert foreign.status_code == 404


async def test_leave_type_from_another_tenant_is_not_found(client, auth, world):
    employee = await auth("emp_a")
    response = await _apply(
        client, employee, world["leave_types"]["beta"], "2027-08-02", "2027-08-03"
    )
    assert response.status_code == 404


async def test_scope_filters_and_cross_tenant_visibility(client, auth, world):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")
    hr = await auth("hr_a")
    foreign_hr = await auth("hr_b")

    request_id = (
        await _apply(client, employee, world["leave_types"]["alpha"], *RANGE_D)
    ).json()["id"]

    mine = await client.get("/leave/requests?scope=mine", headers=employee)
    assert [row["id"] for row in mine.json()] == [request_id]

    team = await client.get("/leave/requests?scope=team", headers=manager)
    assert [row["id"] for row in team.json()] == [request_id]

    company = await client.get("/leave/requests?scope=all&status=pending", headers=hr)
    assert [row["id"] for row in company.json()] == [request_id]

    other_company = await client.get("/leave/requests?scope=all", headers=foreign_hr)
    assert other_company.json() == []

    filter_mismatch = await client.get("/leave/requests?status=approved", headers=employee)
    assert filter_mismatch.json() == []


async def test_self_cancel_guard(client, auth, world):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")
    request_id = (
        await _apply(client, employee, world["leave_types"]["alpha"], *RANGE_A)
    ).json()["id"]

    foreign = await client.post(
        f"/leave/requests/{request_id}/cancel", headers=await auth("hr_a")
    )
    assert foreign.status_code == 403

    cancelled = await client.post(f"/leave/requests/{request_id}/cancel", headers=employee)
    assert cancelled.status_code == 200
    again = await client.post(f"/leave/requests/{request_id}/cancel", headers=employee)
    assert again.status_code == 409
    unused = await client.post(f"/leave/requests/{request_id}/approve", headers=manager)
    assert unused.status_code == 409
