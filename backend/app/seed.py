"""Seed the demo database: platform admin + Aurora Textiles + Northwind Traders."""

import asyncio
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import func, select

from app.core.config import DEVELOPMENT_MODES, get_settings
from app.core.db import session_scope
from app.core.security import hash_password
from app.modules.attendance.models import AttendanceRecord
from app.modules.auth.models import User, UserRole
from app.modules.employees.models import Employee
from app.modules.leave.models import LeaveBalance, LeaveRequest, LeaveStatus, LeaveType
from app.modules.org.models import Department, Designation
from app.modules.tenants.models import Plan, Tenant, TenantStatus

IST = ZoneInfo("Asia/Kolkata")

DEPARTMENTS = ("Administration", "Human Resources", "Finance", "Operations", "Production", "Sales")
DESIGNATIONS = (
    ("Executive", 1),
    ("Senior Executive", 2),
    ("Manager", 3),
    ("Head of Department", 4),
)
LEAVE_TYPES = (
    ("Casual Leave", "casual", Decimal("12.0")),
    ("Sick Leave", "sick", Decimal("8.0")),
    ("Earned Leave", "earned", Decimal("15.0")),
)


def _next_weekday(days_ahead: int = 1) -> date:
    cursor = datetime.now(IST).date() + timedelta(days=days_ahead)
    while cursor.weekday() >= 5:
        cursor += timedelta(days=1)
    return cursor


def _previous_weekday() -> date:
    cursor = datetime.now(IST).date() - timedelta(days=1)
    while cursor.weekday() >= 5:
        cursor -= timedelta(days=1)
    return cursor


def _minutes(start: time, end: time) -> int:
    start_dt = datetime.combine(date.min, start)
    end_dt = datetime.combine(date.min, end)
    return max(0, int((end_dt - start_dt).total_seconds() // 60))


async def _seed_tenant(
    session,
    *,
    name: str,
    slug: str,
    plan: str,
    contact_email: str,
    staff: list[dict],
) -> tuple[Tenant, dict[str, Employee], dict[str, User], dict[str, LeaveType]]:
    tenant = Tenant(
        name=name,
        slug=slug,
        status=TenantStatus.ACTIVE.value,
        plan=plan,
        contact_email=contact_email,
    )
    session.add(tenant)
    await session.flush()

    departments = {}
    for department_name in DEPARTMENTS:
        department = Department(tenant_id=tenant.id, name=department_name)
        session.add(department)
        departments[department_name] = department

    designations = {}
    for title, level in DESIGNATIONS:
        designation = Designation(tenant_id=tenant.id, title=title, level=level)
        session.add(designation)
        designations[title] = designation

    leave_types = {}
    for leave_name, code, quota in LEAVE_TYPES:
        leave_type = LeaveType(
            tenant_id=tenant.id, name=leave_name, code=code, annual_quota_days=quota
        )
        session.add(leave_type)
        leave_types[code] = leave_type

    await session.flush()

    employees: dict[str, Employee] = {}
    users: dict[str, User] = {}
    for row in staff:
        user = User(
            tenant_id=tenant.id,
            email=row["email"],
            full_name=f"{row['first']} {row['last']}",
            hashed_password=hash_password(row["password"]),
            role=row["role"],
            is_active=True,
        )
        session.add(user)
        await session.flush()

        employee = Employee(
            tenant_id=tenant.id,
            user_id=user.id,
            employee_code=row["code"],
            first_name=row["first"],
            last_name=row["last"],
            email=row["email"],
            department_id=departments[row["department"]].id,
            designation_id=designations[row["designation"]].id,
            date_of_joining=row.get("date_of_joining"),
        )
        session.add(employee)
        await session.flush()
        employees[row["code"]] = employee
        users[row["code"]] = user

    for row in staff:
        if row.get("manager"):
            employees[row["code"]].manager_id = employees[row["manager"]].id

    year = datetime.now(IST).year
    for employee in employees.values():
        for leave_type in leave_types.values():
            session.add(
                LeaveBalance(
                    tenant_id=tenant.id,
                    employee_id=employee.id,
                    leave_type_id=leave_type.id,
                    year=year,
                    total_days=leave_type.annual_quota_days,
                    used_days=Decimal("0.0"),
                )
            )
    await session.flush()
    return tenant, employees, users, leave_types


def _add_attendance(
    session,
    tenant: Tenant,
    employee: Employee,
    work_date: date,
    clock_in: time,
    clock_out: time | None = None,
) -> None:
    session.add(
        AttendanceRecord(
            tenant_id=tenant.id,
            employee_id=employee.id,
            work_date=work_date,
            clock_in=clock_in,
            clock_out=clock_out,
            status="present",
            work_minutes=_minutes(clock_in, clock_out) if clock_out else None,
            source="seed",
        )
    )


async def _add_leave_request(
    session,
    tenant: Tenant,
    *,
    employee: Employee,
    leave_type: LeaveType,
    from_date: date,
    to_date: date,
    days: Decimal,
    status: str,
    reason: str,
    reviewer: User | None = None,
    comment: str | None = None,
) -> None:
    session.add(
        LeaveRequest(
            tenant_id=tenant.id,
            employee_id=employee.id,
            leave_type_id=leave_type.id,
            from_date=from_date,
            to_date=to_date,
            days=days,
            reason=reason,
            status=status,
            reviewed_by=reviewer.id if reviewer else None,
            reviewed_at=datetime.now(IST) if reviewer else None,
            review_comment=comment,
        )
    )
    if status == LeaveStatus.APPROVED.value:
        balance = (
            await session.execute(
                select(LeaveBalance).where(
                    LeaveBalance.tenant_id == tenant.id,
                    LeaveBalance.employee_id == employee.id,
                    LeaveBalance.leave_type_id == leave_type.id,
                    LeaveBalance.year == from_date.year,
                )
            )
        ).scalar_one()
        balance.used_days = balance.used_days + days


async def seed() -> None:
    """Insert demo tenants/users. Refuses to run outside development/test so
    known demo credentials can never be created on a production database."""
    if get_settings().environment not in DEVELOPMENT_MODES:
        raise RuntimeError(
            f"Refusing to seed with ENVIRONMENT={get_settings().environment!r}; "
            "demo credentials are development/test only"
        )
    async with session_scope(is_platform_admin=True) as session:
        existing = (await session.execute(select(func.count()).select_from(Tenant))).scalar_one()
        if existing:
            print("Database already seeded (tenants exist). Skipping.")
            return

        session.add(
            User(
                email="admin@cube.io",
                full_name="Platform Admin",
                hashed_password=hash_password("Cube@Admin#2026"),
                role=UserRole.SUPER_ADMIN.value,
                is_active=True,
                is_platform_admin=True,
            )
        )

        aurora, aurora_staff, aurora_users, aurora_types = await _seed_tenant(
            session,
            name="Aurora Textiles",
            slug="aurora",
            plan=Plan.SCALE.value,
            contact_email="priya@aurora.example",
            staff=[
                {
                    "code": "EMP-0001",
                    "first": "Priya",
                    "last": "Sharma",
                    "email": "priya@aurora.example",
                    "department": "Human Resources",
                    "designation": "Head of Department",
                    "role": UserRole.HR_ADMIN.value,
                    "password": "Aurora@2026",
                    "date_of_joining": date(2023, 4, 3),
                },
                {
                    "code": "EMP-0002",
                    "first": "Arjun",
                    "last": "Nair",
                    "email": "arjun@aurora.example",
                    "department": "Production",
                    "designation": "Manager",
                    "role": UserRole.MANAGER.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2023, 6, 12),
                },
                {
                    "code": "EMP-0003",
                    "first": "Meera",
                    "last": "Iyer",
                    "email": "meera@aurora.example",
                    "department": "Production",
                    "designation": "Senior Executive",
                    "manager": "EMP-0002",
                    "role": UserRole.EMPLOYEE.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2024, 1, 15),
                },
                {
                    "code": "EMP-0004",
                    "first": "Kabir",
                    "last": "Khan",
                    "email": "kabir@aurora.example",
                    "department": "Finance",
                    "designation": "Executive",
                    "role": UserRole.EMPLOYEE.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2022, 11, 7),
                },
                {
                    "code": "EMP-0005",
                    "first": "Ananya",
                    "last": "Rao",
                    "email": "ananya@aurora.example",
                    "department": "Administration",
                    "designation": "Executive",
                    "role": UserRole.EMPLOYEE.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2024, 8, 19),
                },
            ],
        )

        northwind, northwind_staff, northwind_users, northwind_types = await _seed_tenant(
            session,
            name="Northwind Traders",
            slug="northwind",
            plan=Plan.BASIC.value,
            contact_email="rohan@northwind.example",
            staff=[
                {
                    "code": "EMP-0001",
                    "first": "Rohan",
                    "last": "Mehta",
                    "email": "rohan@northwind.example",
                    "department": "Operations",
                    "designation": "Head of Department",
                    "role": UserRole.HR_ADMIN.value,
                    "password": "Northwind@2026",
                    "date_of_joining": date(2021, 2, 1),
                },
                {
                    "code": "EMP-0002",
                    "first": "Sneha",
                    "last": "Kulkarni",
                    "email": "sneha@northwind.example",
                    "department": "Sales",
                    "designation": "Manager",
                    "role": UserRole.MANAGER.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2021, 3, 15),
                },
                {
                    "code": "EMP-0003",
                    "first": "Vikram",
                    "last": "Singh",
                    "email": "vikram@northwind.example",
                    "department": "Sales",
                    "designation": "Executive",
                    "manager": "EMP-0002",
                    "role": UserRole.EMPLOYEE.value,
                    "password": "Employee@2026",
                    "date_of_joining": date(2023, 9, 4),
                },
            ],
        )

        today = datetime.now(IST).date()
        yesterday = _previous_weekday()
        for employee in aurora_staff.values():
            _add_attendance(
                session, aurora, employee, yesterday, time(9, 10), time(18, 5)
            )
        _add_attendance(session, aurora, aurora_staff["EMP-0001"], today, time(9, 12))
        _add_attendance(session, aurora, aurora_staff["EMP-0002"], today, time(9, 5))
        _add_attendance(session, aurora, aurora_staff["EMP-0004"], today, time(9, 40))
        for employee in northwind_staff.values():
            _add_attendance(
                session, northwind, employee, yesterday, time(9, 30), time(18, 15)
            )
        _add_attendance(session, northwind, northwind_staff["EMP-0003"], today, time(9, 20))

        next_monday = _next_weekday()
        next_wednesday = _next_weekday(3)
        next_friday = _next_weekday(5)

        await _add_leave_request(
            session,
            aurora,
            employee=aurora_staff["EMP-0003"],
            leave_type=aurora_types["casual"],
            from_date=next_monday,
            to_date=next_monday + timedelta(days=1),
            days=Decimal("2.0"),
            status=LeaveStatus.PENDING.value,
            reason="Family function",
        )
        await _add_leave_request(
            session,
            aurora,
            employee=aurora_staff["EMP-0004"],
            leave_type=aurora_types["sick"],
            from_date=yesterday,
            to_date=yesterday,
            days=Decimal("1.0"),
            status=LeaveStatus.APPROVED.value,
            reason="Medical rest",
            reviewer=aurora_users["EMP-0001"],
            comment="Approved — rest well.",
        )
        await _add_leave_request(
            session,
            aurora,
            employee=aurora_staff["EMP-0005"],
            leave_type=aurora_types["earned"],
            from_date=next_wednesday,
            to_date=next_friday,
            days=Decimal("3.0"),
            status=LeaveStatus.PENDING.value,
            reason="Annual vacation",
        )
        await _add_leave_request(
            session,
            northwind,
            employee=northwind_staff["EMP-0003"],
            leave_type=northwind_types["casual"],
            from_date=next_monday,
            to_date=next_monday,
            days=Decimal("1.0"),
            status=LeaveStatus.PENDING.value,
            reason="Personal errand",
        )

    print("Seed complete.")
    print("  Platform admin : admin@cube.io / Cube@Admin#2026")
    print("  Aurora owner   : priya@aurora.example / Aurora@2026")
    print("  Aurora staff   : arjun@aurora.example, meera@aurora.example,")
    print("                   kabir@aurora.example, ananya@aurora.example / Employee@2026")
    print("  Northwind owner: rohan@northwind.example / Northwind@2026")
    print("  Northwind staff: sneha@northwind.example, vikram@northwind.example / Employee@2026")


if __name__ == "__main__":
    asyncio.run(seed())
