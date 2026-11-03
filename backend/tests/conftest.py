"""Shared test fixtures.

The suite runs against a dedicated database on the compose Postgres instance.
Migrations run as the owner role; the API (and all assertions) run as the
least-privilege ``cube_app`` role so row-level security is really enforced.
"""

import asyncio
import os
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo

import asyncpg
import httpx
import pytest
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
DOTENV = dotenv_values(ROOT / ".env")


def _cfg(key: str, default: str) -> str:
    return os.environ.get(key) or DOTENV.get(key) or default


PG_HOST = "127.0.0.1"
PG_PORT = int(_cfg("POSTGRES_PORT", "5433"))
PG_USER = _cfg("POSTGRES_USER", "cube")
PG_PASSWORD = _cfg("POSTGRES_PASSWORD", "cube_dev_password")
APP_USER = _cfg("APP_DB_USER", "cube_app")
APP_PASSWORD = _cfg("APP_DB_PASSWORD", "cube_app_dev_password")
TEST_DB = os.environ.get("CUBE_TEST_DB", "cube_hrms_test")

ADMIN_DSN = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}"
ADMIN_TEST_DSN = f"{ADMIN_DSN}/{TEST_DB}"
APP_TEST_URL = f"postgresql+asyncpg://{APP_USER}:{APP_PASSWORD}@{PG_HOST}:{PG_PORT}/{TEST_DB}"
ADMIN_TEST_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{TEST_DB}"

# Settings must see the test database before app.core.config is imported.
os.environ["DATABASE_URL"] = APP_TEST_URL
os.environ["MIGRATION_DATABASE_URL"] = ADMIN_TEST_URL
os.environ["ENVIRONMENT"] = "development"
os.environ["JWT_SECRET"] = "test-only-secret-not-for-production"

PASSWORD = "Test@2026"
PASSWORD_HASH = None  # computed once, lazily
IST = ZoneInfo("Asia/Kolkata")

TABLES = (
    "audit_logs",
    "refresh_tokens",
    "leave_requests",
    "leave_balances",
    "leave_types",
    "attendance_records",
    "employees",
    "designations",
    "departments",
    "users",
    "tenants",
)


async def _admin_connection() -> asyncpg.Connection:
    return await asyncpg.connect(ADMIN_TEST_DSN)


@pytest.fixture(scope="session")
async def database():
    from app.core.db import get_engine
    from app.core.security import hash_password

    global PASSWORD_HASH
    PASSWORD_HASH = hash_password(PASSWORD)

    admin = await asyncpg.connect(f"{ADMIN_DSN}/postgres")
    await admin.execute(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = $1 AND pid <> pg_backend_pid()",
        TEST_DB,
    )
    await admin.execute(f'DROP DATABASE IF EXISTS "{TEST_DB}"')
    await admin.execute(f'CREATE DATABASE "{TEST_DB}"')
    await admin.execute(
        f"""
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{APP_USER}') THEN
            CREATE ROLE {APP_USER} LOGIN PASSWORD '{APP_PASSWORD}' NOSUPERUSER;
          END IF;
        END $$;
        """
    )
    await admin.close()

    env = os.environ.copy()
    env["DATABASE_URL"] = APP_TEST_URL
    env["MIGRATION_DATABASE_URL"] = ADMIN_TEST_URL
    process = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "alembic",
        "upgrade",
        "head",
        cwd=BACKEND,
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    output, _ = await process.communicate()
    assert process.returncode == 0, output.decode()

    grant = await _admin_connection()
    await grant.execute(f"GRANT USAGE ON SCHEMA public TO {APP_USER}")
    await grant.execute(
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {APP_USER}"
    )
    await grant.execute(
        f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {APP_USER}"
    )
    await grant.close()

    yield TEST_DB

    await get_engine().dispose()


@pytest.fixture(autouse=True)
async def clean_database(database):
    connection = await _admin_connection()
    await connection.execute(f"TRUNCATE {', '.join(TABLES)} RESTART IDENTITY CASCADE")
    await connection.close()
    yield


@pytest.fixture
async def app():
    from app.main import create_app

    return create_app()


@pytest.fixture
async def client(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as c:
        yield c


@pytest.fixture
async def admin_db():
    """Owner connection (superuser) for assertions and fixture mutations."""
    connection = await _admin_connection()
    yield connection
    await connection.close()


@pytest.fixture
async def app_db():
    """Least-privilege connection with no RLS context set."""
    connection = await asyncpg.connect(APP_TEST_URL.replace("postgresql+asyncpg://", "postgresql://"))
    yield connection
    await connection.close()


@pytest.fixture
async def world():
    """Two tenants, each with an HR admin; tenant A also has a manager + report."""
    from app.core.db import session_scope
    from app.modules.auth.models import User, UserRole
    from app.modules.employees.models import Employee
    from app.modules.leave.models import LeaveBalance, LeaveType
    from app.modules.org.models import Department, Designation
    from app.modules.tenants.models import Plan, Tenant, TenantStatus

    year = datetime.now(IST).year
    ids: dict = {
        "emails": {
            "admin": "admin@cube.example",
            "hr_a": "hr@alpha.example",
            "mgr_a": "manager@alpha.example",
            "emp_a": "employee@alpha.example",
            "hr_b": "hr@beta.example",
        },
        "passwords": {"admin": PASSWORD},
        "year": year,
    }

    async with session_scope(is_platform_admin=True) as session:
        admin = User(
            tenant_id=None,
            email=ids["emails"]["admin"],
            full_name="Platform Admin",
            hashed_password=PASSWORD_HASH,
            role=UserRole.SUPER_ADMIN.value,
            is_active=True,
            is_platform_admin=True,
        )
        alpha = Tenant(
            name="Alpha Textiles",
            slug="alpha",
            status=TenantStatus.ACTIVE.value,
            plan=Plan.SCALE.value,
            contact_email="hr@alpha.example",
        )
        beta = Tenant(
            name="Beta Foods",
            slug="beta",
            status=TenantStatus.ACTIVE.value,
            plan=Plan.BASIC.value,
            contact_email="hr@beta.example",
        )
        session.add_all([admin, alpha, beta])
        await session.flush()
        ids["tenants"] = {"alpha": alpha.id, "beta": beta.id}

        dept_hr_a = Department(tenant_id=alpha.id, name="Human Resources")
        dept_prod_a = Department(tenant_id=alpha.id, name="Production")
        dept_hr_b = Department(tenant_id=beta.id, name="Human Resources")
        head_a = Designation(tenant_id=alpha.id, title="Head of Department", level=4)
        manager_a = Designation(tenant_id=alpha.id, title="Manager", level=3)
        exec_a = Designation(tenant_id=alpha.id, title="Executive", level=1)
        head_b = Designation(tenant_id=beta.id, title="Head of Department", level=4)
        session.add_all(
            [dept_hr_a, dept_prod_a, dept_hr_b, head_a, manager_a, exec_a, head_b]
        )
        await session.flush()
        ids["departments"] = {
            "hr_a": dept_hr_a.id,
            "prod_a": dept_prod_a.id,
            "hr_b": dept_hr_b.id,
        }

        async def add_user(key: str, role: str, tenant_id: int | None, name: str) -> User:
            user = User(
                tenant_id=tenant_id,
                email=ids["emails"][key],
                full_name=name,
                hashed_password=PASSWORD_HASH,
                role=role,
                is_active=True,
            )
            session.add(user)
            await session.flush()
            ids.setdefault("users", {})[key] = user.id
            return user

        async def add_employee(
            key: str,
            tenant_id: int,
            code: str,
            name: str,
            department_id: int,
            designation_id: int,
            user: User,
            manager_id: int | None = None,
        ) -> Employee:
            first, last = name.split(" ", 1)
            employee = Employee(
                tenant_id=tenant_id,
                user_id=user.id,
                employee_code=code,
                first_name=first,
                last_name=last,
                email=user.email,
                department_id=department_id,
                designation_id=designation_id,
                manager_id=manager_id,
                date_of_joining=datetime(2023, 1, 9).date(),
            )
            session.add(employee)
            await session.flush()
            ids.setdefault("employees", {})[key] = employee.id
            return employee

        hr_a = await add_user("hr_a", UserRole.HR_ADMIN.value, alpha.id, "Hema Rao")
        mgr_a = await add_user("mgr_a", UserRole.MANAGER.value, alpha.id, "Manoj Pillai")
        emp_a = await add_user("emp_a", UserRole.EMPLOYEE.value, alpha.id, "Esha Menon")
        hr_b = await add_user("hr_b", UserRole.HR_ADMIN.value, beta.id, "Bhavna Shah")

        await add_employee("hr_a", alpha.id, "A-0001", "Hema Rao", dept_hr_a.id, head_a.id, hr_a)
        mgr_emp = await add_employee(
            "mgr_a", alpha.id, "A-0002", "Manoj Pillai", dept_prod_a.id, manager_a.id, mgr_a
        )
        await add_employee(
            "emp_a",
            alpha.id,
            "A-0003",
            "Esha Menon",
            dept_prod_a.id,
            exec_a.id,
            emp_a,
            manager_id=mgr_emp.id,
        )
        await add_employee("hr_b", beta.id, "B-0001", "Bhavna Shah", dept_hr_b.id, head_b.id, hr_b)

        leave_a = LeaveType(
            tenant_id=alpha.id,
            name="Casual Leave",
            code="casual",
            annual_quota_days=Decimal("12.0"),
        )
        leave_b = LeaveType(
            tenant_id=beta.id,
            name="Casual Leave",
            code="casual",
            annual_quota_days=Decimal("12.0"),
        )
        session.add_all([leave_a, leave_b])
        await session.flush()
        ids["leave_types"] = {"alpha": leave_a.id, "beta": leave_b.id}

        for employee_id in ids["employees"].values():
            tenant_id = alpha.id if employee_id != ids["employees"]["hr_b"] else beta.id
            leave_type_id = leave_a.id if tenant_id == alpha.id else leave_b.id
            session.add(
                LeaveBalance(
                    tenant_id=tenant_id,
                    employee_id=employee_id,
                    leave_type_id=leave_type_id,
                    year=year,
                    total_days=Decimal("12.0"),
                    used_days=Decimal("0.0"),
                )
            )

    return ids


@pytest.fixture
def auth(client, world):
    async def _login(key: str = "hr_a") -> dict[str, str]:
        response = await client.post(
            "/auth/login",
            json={"email": world["emails"][key], "password": PASSWORD},
        )
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _login
