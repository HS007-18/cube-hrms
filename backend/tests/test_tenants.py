from .conftest import PASSWORD


async def _platform_headers(client, world):
    response = await client.post(
        "/auth/login", json={"email": world["emails"]["admin"], "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def test_platform_admin_lists_and_reads_tenants(client, world):
    headers = await _platform_headers(client, world)
    listing = await client.get("/tenants", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 2
    assert {item["slug"] for item in listing.json()["items"]} == {"alpha", "beta"}

    detail = await client.get(
        f"/tenants/{world['tenants']['alpha']}", headers=headers
    )
    assert detail.status_code == 200
    assert detail.json()["employee_count"] == 3
    assert detail.json()["owner_name"] == "Hema Rao"


async def test_tenant_users_cannot_use_platform_endpoints(client, auth, world):
    headers = await auth("hr_a")
    for method, path in (
        ("get", "/tenants"),
        ("get", f"/tenants/{world['tenants']['alpha']}"),
        ("post", f"/tenants/{world['tenants']['alpha']}/provision"),
    ):
        response = await getattr(client, method)(path, headers=headers)
        assert response.status_code == 403, (method, path, response.text)


async def test_create_provision_and_login_owner(client, world):
    headers = await _platform_headers(client, world)
    payload = {
        "name": "Gamma Logistics",
        "slug": "gamma-logistics",
        "plan": "basic",
        "contact_email": "contact@gamma.example",
        "owner_name": "Gita Verma",
        "owner_email": "owner@gamma.example",
    }
    created = await client.post("/tenants", json=payload, headers=headers)
    assert created.status_code == 201, created.text
    body = created.json()
    tenant_id = body["tenant"]["id"]
    temporary_password = body["temporary_password"]
    assert body["tenant"]["status"] == "pending"
    assert len(temporary_password) >= 12

    # The owner exists but stays inactive until the tenant is provisioned.
    blocked = await client.post(
        "/auth/login", json={"email": "owner@gamma.example", "password": temporary_password}
    )
    assert blocked.status_code == 403

    provisioned = await client.post(f"/tenants/{tenant_id}/provision", headers=headers)
    assert provisioned.status_code == 200, provisioned.text
    assert provisioned.json()["tenant"]["status"] == "active"

    login = await client.post(
        "/auth/login", json={"email": "owner@gamma.example", "password": temporary_password}
    )
    assert login.status_code == 200
    owner_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Provisioning seeds a usable tenant with defaults.
    departments = await client.get("/departments", headers=owner_headers)
    assert departments.status_code == 200
    assert len(departments.json()) == 4
    leave_types = await client.get("/leave/types", headers=owner_headers)
    assert leave_types.status_code == 200
    assert len(leave_types.json()) == 3

    duplicate = await client.post("/tenants", json=payload, headers=headers)
    assert duplicate.status_code == 409

    again = await client.post(f"/tenants/{tenant_id}/provision", headers=headers)
    assert again.status_code == 409


async def test_tenant_status_transitions_are_guarded(client, world):
    headers = await _platform_headers(client, world)
    created = await client.post(
        "/tenants",
        json={
            "name": "Delta Retail",
            "slug": "delta-retail",
            "plan": "free",
            "contact_email": "hi@delta.example",
            "owner_name": "Dev Patel",
            "owner_email": "dev@delta.example",
        },
        headers=headers,
    )
    assert created.status_code == 201
    tenant_id = created.json()["tenant"]["id"]

    invalid = await client.patch(
        f"/tenants/{tenant_id}/status", json={"status": "suspended"}, headers=headers
    )
    assert invalid.status_code == 400

    cancelled = await client.patch(
        f"/tenants/{tenant_id}/status", json={"status": "cancelled"}, headers=headers
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    blocked = await client.patch(
        f"/tenants/{tenant_id}/status", json={"status": "active"}, headers=headers
    )
    assert blocked.status_code == 400

    provision = await client.post(f"/tenants/{tenant_id}/provision", headers=headers)
    assert provision.status_code == 409


async def test_tenant_payload_validation(client, world):
    headers = await _platform_headers(client, world)
    response = await client.post(
        "/tenants",
        json={
            "name": "Bad Slug",
            "slug": "Not A Slug",
            "contact_email": "not-an-email",
            "owner_name": "X",
            "owner_email": "also-bad",
        },
        headers=headers,
    )
    assert response.status_code == 422
