import pytest

from .conftest import PASSWORD


async def test_login_is_case_insensitive_and_returns_profile(client, world):
    response = await client.post(
        "/auth/login",
        json={"email": "HR@ALPHA.EXAMPLE", "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "hr_admin"
    assert body["user"]["tenant_name"] == "Alpha Textiles"
    assert body["user"]["employee_id"] == world["employees"]["hr_a"]


@pytest.mark.parametrize(
    ("email", "password"),
    [
        ("hr@alpha.example", "wrong-password"),
        ("nobody@alpha.example", PASSWORD),
    ],
)
async def test_login_rejects_bad_credentials(client, world, email, password):
    response = await client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


async def test_me_requires_a_valid_token(client):
    assert (await client.get("/auth/me")).status_code == 401
    response = await client.get("/auth/me", headers={"Authorization": "Bearer nonsense"})
    assert response.status_code == 401


async def test_me_and_logout_revokes_refresh_tokens(client, world):
    login = await client.post(
        "/auth/login", json={"email": world["emails"]["emp_a"], "password": PASSWORD}
    )
    tokens = login.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    me = await client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "employee@alpha.example"

    logout = await client.post("/auth/logout", headers=headers)
    assert logout.status_code == 204
    assert logout.content == b""

    revoked = await client.post(
        "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert revoked.status_code == 401


async def test_refresh_rotates_and_detects_reuse(client, world):
    login = await client.post(
        "/auth/login", json={"email": world["emails"]["hr_a"], "password": PASSWORD}
    )
    tokens = login.json()

    refreshed = await client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200
    rotated = refreshed.json()
    assert rotated["access_token"] != tokens["access_token"]
    assert rotated["refresh_token"] != tokens["refresh_token"]

    reuse = await client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert reuse.status_code == 401
    assert "already been used" in reuse.json()["detail"]

    # Reuse detection burns the whole token family, including the newest token.
    family_burned = await client.post(
        "/auth/refresh", json={"refresh_token": rotated["refresh_token"]}
    )
    assert family_burned.status_code == 401

    misuse = await client.post("/auth/refresh", json={"refresh_token": rotated["access_token"]})
    assert misuse.status_code == 401


async def test_inactive_account_cannot_log_in(client, world, admin_db):
    await admin_db.execute(
        "UPDATE users SET is_active = false WHERE email = $1", world["emails"]["hr_a"]
    )
    response = await client.post(
        "/auth/login", json={"email": world["emails"]["hr_a"], "password": PASSWORD}
    )
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"]
