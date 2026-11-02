from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.errors import bad_request, conflict, not_found
from app.core.security import hash_password
from app.modules.audit import service as audit
from app.modules.auth.models import User
from app.modules.employees.models import Employee
from app.modules.employees.schemas import (
    EmployeeCreate,
    EmployeeCreated,
    EmployeeOut,
    EmployeeUpdate,
)
from app.modules.leave.models import LeaveBalance, LeaveType
from app.modules.org.models import Department, Designation
from app.modules.tenants.service import generate_temporary_password

IST = ZoneInfo("Asia/Kolkata")
Manager = aliased(Employee)


def _base_query():
    return (
        select(
            Employee,
            Department.name,
            Designation.title,
            Manager.first_name,
            Manager.last_name,
        )
        .outerjoin(Department, Employee.department_id == Department.id)
        .outerjoin(Designation, Employee.designation_id == Designation.id)
        .outerjoin(Manager, Employee.manager_id == Manager.id)
    )


def _to_out(row) -> EmployeeOut:
    employee, department_name, designation_title, manager_first, manager_last = row
    manager_name = " ".join(part for part in (manager_first, manager_last) if part) or None
    return EmployeeOut(
        id=employee.id,
        employee_code=employee.employee_code,
        first_name=employee.first_name,
        last_name=employee.last_name,
        full_name=employee.full_name,
        email=employee.email,
        phone=employee.phone,
        department_id=employee.department_id,
        department_name=department_name,
        designation_id=employee.designation_id,
        designation_title=designation_title,
        manager_id=employee.manager_id,
        manager_name=manager_name,
        date_of_joining=employee.date_of_joining,
        employment_type=employee.employment_type,
        is_active=employee.is_active,
        has_account=employee.user_id is not None,
        pan=employee.pan,
        uan=employee.uan,
        created_at=employee.created_at,
    )


async def employee_for_user(session: AsyncSession, user_id: int) -> Employee | None:
    return (
        await session.execute(select(Employee).where(Employee.user_id == user_id))
    ).scalar_one_or_none()


async def get_employee(session: AsyncSession, employee_id: int) -> EmployeeOut:
    row = (await session.execute(_base_query().where(Employee.id == employee_id))).first()
    if row is None:
        raise not_found("Employee")
    return _to_out(row)


async def list_employees(
    session: AsyncSession,
    *,
    q: str | None = None,
    department_id: int | None = None,
    designation_id: int | None = None,
    include_inactive: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[EmployeeOut], int]:
    filters = []
    if not include_inactive:
        filters.append(Employee.is_active.is_(True))
    if department_id is not None:
        filters.append(Employee.department_id == department_id)
    if designation_id is not None:
        filters.append(Employee.designation_id == designation_id)
    if q:
        pattern = f"%{q.strip().lower()}%"
        filters.append(
            func.lower(Employee.first_name).like(pattern)
            | func.lower(Employee.last_name).like(pattern)
            | func.lower(func.coalesce(Employee.email, "")).like(pattern)
            | func.lower(Employee.employee_code).like(pattern)
        )

    total = (
        await session.execute(select(func.count()).select_from(Employee).where(*filters))
    ).scalar_one()
    rows = (
        await session.execute(
            _base_query()
            .where(*filters)
            .order_by(Employee.first_name, Employee.last_name)
            .limit(limit)
            .offset(offset)
        )
    ).all()
    return [_to_out(row) for row in rows], total


async def _next_employee_code(session: AsyncSession) -> str:
    count = (
        await session.execute(select(func.count()).select_from(Employee))
    ).scalar_one()
    for index in range(count + 1, count + 500):
        code = f"EMP-{index:04d}"
        exists = (
            await session.execute(select(Employee.id).where(Employee.employee_code == code))
        ).first()
        if exists is None:
            return code
    raise bad_request("Could not allocate an employee code")


async def _validate_references(
    session: AsyncSession,
    *,
    department_id: int | None,
    designation_id: int | None,
    manager_id: int | None,
) -> None:
    if department_id is not None and await session.get(Department, department_id) is None:
        raise not_found("Department")
    if designation_id is not None and await session.get(Designation, designation_id) is None:
        raise not_found("Designation")
    if manager_id is not None and await session.get(Employee, manager_id) is None:
        raise not_found("Reporting manager")


async def _create_leave_balances(session: AsyncSession, employee_id: int) -> None:
    year = datetime.now(IST).year
    leave_types = (
        await session.execute(select(LeaveType).where(LeaveType.is_active.is_(True)))
    ).scalars()
    for leave_type in leave_types:
        session.add(
            LeaveBalance(
                employee_id=employee_id,
                leave_type_id=leave_type.id,
                year=year,
                total_days=leave_type.annual_quota_days,
                used_days=Decimal("0.0"),
            )
        )


async def create_employee(
    session: AsyncSession, *, payload: EmployeeCreate, actor
) -> EmployeeCreated:
    await _validate_references(
        session,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        manager_id=payload.manager_id,
    )

    email = str(payload.email).strip().lower() if payload.email else None
    temporary_password: str | None = None
    user: User | None = None

    if payload.create_account:
        if not email:
            raise bad_request("An email is required to create a login account")
        duplicate = (
            await session.execute(select(User.id).where(func.lower(User.email) == email))
        ).scalar_one_or_none()
        if duplicate is not None:
            raise conflict("A user with this email already exists")
        temporary_password = payload.password or generate_temporary_password()
        user = User(
            email=email,
            full_name=f"{payload.first_name} {payload.last_name}".strip(),
            hashed_password=hash_password(temporary_password),
            role=payload.role,
            is_active=True,
        )
        session.add(user)
        await session.flush()

    employee_code = payload.employee_code or await _next_employee_code(session)
    employee = Employee(
        user_id=user.id if user else None,
        employee_code=employee_code,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        phone=payload.phone,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        manager_id=payload.manager_id,
        date_of_joining=payload.date_of_joining,
        employment_type=payload.employment_type,
        pan=payload.pan,
        aadhaar_last4=payload.aadhaar_last4,
        uan=payload.uan,
        esic=payload.esic,
        bank_ifsc=payload.bank_ifsc,
    )
    session.add(employee)
    await session.flush()

    await _create_leave_balances(session, employee.id)
    await audit.record(
        session,
        actor=actor,
        action="employee.created",
        entity_type="employee",
        entity_id=employee.id,
        meta={"employee_code": employee.employee_code, "email": email},
    )

    row = (await session.execute(_base_query().where(Employee.id == employee.id))).one()
    return EmployeeCreated(**_to_out(row).model_dump(), temporary_password=temporary_password)


async def update_employee(
    session: AsyncSession, *, employee_id: int, payload: EmployeeUpdate, actor
) -> EmployeeOut:
    employee = await session.get(Employee, employee_id)
    if employee is None:
        raise not_found("Employee")

    changes = payload.model_dump(exclude_unset=True)
    await _validate_references(
        session,
        department_id=changes.get("department_id"),
        designation_id=changes.get("designation_id"),
        manager_id=changes.get("manager_id"),
    )

    if "employee_code" in changes:
        changes.pop("employee_code")  # codes are immutable once issued

    for field, value in changes.items():
        setattr(employee, field, value)

    if changes.get("is_active") is False and employee.user_id is not None:
        user = await session.get(User, employee.user_id)
        if user is not None:
            user.is_active = False

    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="employee.updated",
        entity_type="employee",
        entity_id=employee.id,
        meta={"fields": sorted(changes.keys())},
    )
    return await get_employee(session, employee.id)
