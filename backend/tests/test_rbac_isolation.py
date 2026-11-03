"""Tenant isolation: API-level authorization plus direct RLS assertions."""


async def test_directory_is_scoped_to_own_tenant(client, auth, world):
    alpha = await client.get("/employees", headers=await auth("hr_a"))
    assert alpha.status_code == 200
    assert alpha.json()["total"] == 3
    assert {item["employee_code"] for item in alpha.json()["items"]} == {
        "A-0001",
        "A-0002",
        "A-0003",
    }

    beta = await client.get("/employees", headers=await auth("hr_b"))
    assert beta.status_code == 200
    assert beta.json()["total"] == 1
    assert beta.json()["items"][0]["employee_code"] == "B-0001"


async def test_cross_tenant_reads_and_writes_look_like_404(client, auth, world):
    headers = await auth("hr_a")
    beta_employee = world["employees"]["hr_b"]

    read = await client.get(f"/employees/{beta_employee}", headers=headers)
    assert read.status_code == 404

    update = await client.patch(
        f"/employees/{beta_employee}", json={"first_name": "Hacked"}, headers=headers
    )
    assert update.status_code == 404

    create = await client.post(
        "/employees",
        json={
            "first_name": "Cross",
            "last_name": "Tenant",
            "department_id": world["departments"]["hr_b"],
        },
        headers=headers,
    )
    assert create.status_code == 404


async def test_role_guards(client, auth):
    employee = await auth("emp_a")
    manager = await auth("mgr_a")

    assert (await client.get("/employees", headers=employee)).status_code == 403
    assert (await client.get("/employees", headers=manager)).status_code == 403
    assert (await client.post("/employees", json={}, headers=employee)).status_code == 403
    assert (await client.get("/attendance", headers=employee)).status_code == 403
    assert (await client.get("/departments", headers=employee)).status_code == 200
    assert (
        await client.post(
            "/departments", json={"name": "Shadow"}, headers=employee
        )
    ).status_code == 403


async def test_platform_admin_cannot_use_tenant_hr_endpoints(client, world):
    login = await client.post(
        "/auth/login", json={"email": world["emails"]["admin"], "password": "Test@2026"}
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert (await client.get("/employees", headers=headers)).status_code == 403
    assert (await client.get("/dashboard/summary", headers=headers)).status_code == 403


async def test_postgres_rls_blocks_unscoped_and_cross_tenant_queries(app_db, world):
    assert await app_db.fetchval("SELECT count(*) FROM employees") == 0

    await app_db.execute(
        "SELECT set_config('app.current_tenant_id', $1, false)",
        str(world["tenants"]["alpha"]),
    )
    assert await app_db.fetchval("SELECT count(*) FROM employees") == 3
    assert (
        await app_db.fetchval(
            "SELECT count(*) FROM employees WHERE tenant_id = $1",
            world["tenants"]["beta"],
        )
        == 0
    )
    with_other_tenant = await app_db.fetchval(
        "SELECT count(*) FROM employees WHERE tenant_id = $1",
        world["tenants"]["beta"],
    )
    assert with_other_tenant == 0

    await app_db.execute(
        "SELECT set_config('app.current_tenant_id', $1, false)",
        str(world["tenants"]["beta"]),
    )
    assert await app_db.fetchval("SELECT count(*) FROM employees") == 1

    await app_db.execute("SELECT set_config('app.current_tenant_id', '', false)")
    await app_db.execute("SELECT set_config('app.is_platform_admin', 'true', false)")
    assert await app_db.fetchval("SELECT count(*) FROM employees") == 4


async def test_tenant_session_cannot_insert_foreign_rows(app_db, world):
    await app_db.execute(
        "SELECT set_config('app.current_tenant_id', $1, false)",
        str(world["tenants"]["alpha"]),
    )
    try:
        await app_db.execute(
            """
            INSERT INTO departments (tenant_id, name)
            VALUES ($1, 'Smuggled Department')
            """,
            world["tenants"]["beta"],
        )
    except Exception as exc:  # noqa: BLE001 - asserting the database rejects it
        assert "row-level security" in str(exc).lower()
    else:  # pragma: no cover - failure path
        raise AssertionError("RLS allowed a cross-tenant insert")
