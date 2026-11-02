from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import bad_request, conflict, forbidden, not_found
from app.modules.audit import service as audit
from app.modules.employees.models import Employee
from app.modules.employees.service import employee_for_user
from app.modules.leave.models import LeaveBalance, LeaveRequest, LeaveStatus, LeaveType
from app.modules.leave.schemas import (
    LeaveBalanceOut,
    LeaveRequestCreate,
    LeaveRequestOut,
    LeaveTypeCreate,
    LeaveTypeOut,
    LeaveTypeUpdate,
)

IST = ZoneInfo("Asia/Kolkata")


def _current_year() -> int:
    return datetime.now(IST).year


def business_days_between(from_date: date, to_date: date) -> Decimal:
    """Inclusive weekday count. Holidays join this calc in Wave 2."""
    days = 0
    cursor = from_date
    while cursor <= to_date:
        if cursor.weekday() < 5:
            days += 1
        cursor += timedelta(days=1)
    return Decimal(days)


async def _require_employee(session: AsyncSession, user_id: int) -> Employee:
    employee = await employee_for_user(session, user_id)
    if employee is None:
        raise bad_request("No employee profile is linked to this account")
    return employee


async def list_leave_types(
    session: AsyncSession, *, include_inactive: bool = False
) -> list[LeaveTypeOut]:
    query = select(LeaveType).order_by(LeaveType.name)
    if not include_inactive:
        query = query.where(LeaveType.is_active.is_(True))
    rows = (await session.execute(query)).scalars()
    return [LeaveTypeOut.model_validate(row) for row in rows]


async def create_leave_type(session: AsyncSession, payload: LeaveTypeCreate) -> LeaveTypeOut:
    duplicate = (
        await session.execute(select(LeaveType.id).where(LeaveType.code == payload.code))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise conflict("A leave type with this code already exists")
    leave_type = LeaveType(
        name=payload.name.strip(),
        code=payload.code,
        annual_quota_days=payload.annual_quota_days,
        is_paid=payload.is_paid,
        carry_forward=payload.carry_forward,
    )
    session.add(leave_type)
    await session.flush()
    return LeaveTypeOut.model_validate(leave_type)


async def update_leave_type(
    session: AsyncSession, leave_type_id: int, payload: LeaveTypeUpdate
) -> LeaveTypeOut:
    leave_type = await session.get(LeaveType, leave_type_id)
    if leave_type is None:
        raise not_found("Leave type")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(leave_type, field, value)
    await session.flush()
    return LeaveTypeOut.model_validate(leave_type)


async def _get_or_create_balance(
    session: AsyncSession, *, employee_id: int, leave_type: LeaveType, year: int
) -> LeaveBalance:
    balance = (
        await session.execute(
            select(LeaveBalance).where(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.leave_type_id == leave_type.id,
                LeaveBalance.year == year,
            )
        )
    ).scalar_one_or_none()
    if balance is None:
        balance = LeaveBalance(
            employee_id=employee_id,
            leave_type_id=leave_type.id,
            year=year,
            total_days=leave_type.annual_quota_days,
            used_days=Decimal("0.0"),
        )
        session.add(balance)
        await session.flush()
    return balance


async def list_balances(
    session: AsyncSession, *, user_id: int, year: int | None = None
) -> list[LeaveBalanceOut]:
    employee = await _require_employee(session, user_id)
    target_year = year or _current_year()
    leave_types = (
        await session.execute(select(LeaveType).where(LeaveType.is_active.is_(True)))
    ).scalars()
    results: list[LeaveBalanceOut] = []
    for leave_type in leave_types:
        balance = await _get_or_create_balance(
            session, employee_id=employee.id, leave_type=leave_type, year=target_year
        )
        results.append(
            LeaveBalanceOut(
                leave_type_id=leave_type.id,
                leave_type_name=leave_type.name,
                year=target_year,
                total_days=balance.total_days,
                used_days=balance.used_days,
                remaining_days=balance.total_days - balance.used_days,
            )
        )
    return sorted(results, key=lambda item: item.leave_type_name)


def _to_out(request: LeaveRequest, employee_name: str, leave_type_name: str) -> LeaveRequestOut:
    return LeaveRequestOut(
        id=request.id,
        employee_id=request.employee_id,
        employee_name=employee_name,
        leave_type_name=leave_type_name,
        from_date=request.from_date,
        to_date=request.to_date,
        days=request.days,
        reason=request.reason,
        status=request.status,
        review_comment=request.review_comment,
        created_at=request.created_at,
    )


async def apply_leave(
    session: AsyncSession, *, user_id: int, payload: LeaveRequestCreate, actor
) -> LeaveRequestOut:
    employee = await _require_employee(session, user_id)
    leave_type = await session.get(LeaveType, payload.leave_type_id)
    if leave_type is None or not leave_type.is_active:
        raise not_found("Leave type")
    if payload.from_date > payload.to_date:
        raise bad_request("The start date must be on or before the end date")
    if payload.from_date.year != payload.to_date.year:
        raise bad_request("Leave must fall within a single calendar year")

    days = business_days_between(payload.from_date, payload.to_date)
    if days <= 0:
        raise bad_request("The selected range contains no working days")

    overlap = (
        await session.execute(
            select(LeaveRequest.id).where(
                LeaveRequest.employee_id == employee.id,
                LeaveRequest.status.in_(
                    [LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value]
                ),
                LeaveRequest.from_date <= payload.to_date,
                LeaveRequest.to_date >= payload.from_date,
            )
        )
    ).first()
    if overlap is not None:
        raise conflict("This range overlaps an existing leave request")

    balance = await _get_or_create_balance(
        session,
        employee_id=employee.id,
        leave_type=leave_type,
        year=payload.from_date.year,
    )
    remaining = balance.total_days - balance.used_days
    if days > remaining:
        raise bad_request(
            f"Insufficient balance: {remaining} day(s) of {leave_type.name} available"
        )

    request = LeaveRequest(
        employee_id=employee.id,
        leave_type_id=leave_type.id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        days=days,
        reason=payload.reason,
        status=LeaveStatus.PENDING.value,
    )
    session.add(request)
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="leave.applied",
        entity_type="leave_request",
        entity_id=request.id,
        meta={"days": str(days), "leave_type": leave_type.code},
    )
    return _to_out(request, employee.full_name, leave_type.name)


async def list_requests(
    session: AsyncSession,
    *,
    role: str,
    user_id: int,
    scope: str = "mine",
    status_filter: str | None = None,
) -> list[LeaveRequestOut]:
    filters = []
    if role == "hr_admin" and scope == "all":
        pass  # company-wide view needs no employee profile
    else:
        employee = await _require_employee(session, user_id)
        if role == "employee" or scope == "mine":
            filters.append(LeaveRequest.employee_id == employee.id)
        elif scope == "team" or role == "manager":
            team_ids = select(Employee.id).where(Employee.manager_id == employee.id)
            filters.append(
                LeaveRequest.employee_id.in_(team_ids)
                | (LeaveRequest.employee_id == employee.id)
            )
    if status_filter:
        filters.append(LeaveRequest.status == status_filter)

    rows = (
        await session.execute(
            select(LeaveRequest, Employee, LeaveType)
            .join(Employee, LeaveRequest.employee_id == Employee.id)
            .join(LeaveType, LeaveRequest.leave_type_id == LeaveType.id)
            .where(*filters)
            .order_by(LeaveRequest.created_at.desc())
            .limit(200)
        )
    ).all()
    return [
        _to_out(request, employee_row.full_name, leave_type.name)
        for request, employee_row, leave_type in rows
    ]


async def _assert_can_review(
    session: AsyncSession, *, role: str, user_id: int, request: LeaveRequest
) -> None:
    if role == "hr_admin":
        return
    if role != "manager":
        raise forbidden()
    manager = await employee_for_user(session, user_id)
    if manager is None:
        raise forbidden()
    employee = await session.get(Employee, request.employee_id)
    if employee is None or employee.manager_id != manager.id:
        raise forbidden("Managers can only review their direct reports' requests")


async def _load_for_review(
    session: AsyncSession, *, request_id: int, role: str, user_id: int
) -> LeaveRequest:
    request = await session.get(LeaveRequest, request_id)
    if request is None:
        raise not_found("Leave request")
    await _assert_can_review(session, role=role, user_id=user_id, request=request)
    return request


async def _output(
    session: AsyncSession, request: LeaveRequest
) -> LeaveRequestOut:
    employee = await session.get(Employee, request.employee_id)
    leave_type = await session.get(LeaveType, request.leave_type_id)
    return _to_out(
        request,
        employee.full_name if employee else "Unknown",
        leave_type.name if leave_type else "Unknown",
    )


async def approve_request(
    session: AsyncSession, *, request_id: int, comment: str | None, role: str, user_id: int, actor
) -> LeaveRequestOut:
    request = await _load_for_review(session, request_id=request_id, role=role, user_id=user_id)
    if request.status != LeaveStatus.PENDING.value:
        raise conflict(f"Only pending requests can be approved (current: {request.status})")

    balance = (
        await session.execute(
            select(LeaveBalance)
            .where(
                LeaveBalance.employee_id == request.employee_id,
                LeaveBalance.leave_type_id == request.leave_type_id,
                LeaveBalance.year == request.from_date.year,
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    if balance is None:
        raise bad_request("No leave balance exists for this request")
    remaining = balance.total_days - balance.used_days
    if request.days > remaining:
        raise bad_request(
            f"Insufficient balance to approve: {remaining} day(s) remaining"
        )

    balance.used_days = balance.used_days + request.days
    request.status = LeaveStatus.APPROVED.value
    request.reviewed_by = actor.id
    request.reviewed_at = datetime.now(UTC)
    request.review_comment = comment
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="leave.approved",
        entity_type="leave_request",
        entity_id=request.id,
        meta={"days": str(request.days)},
    )
    return await _output(session, request)


async def deny_request(
    session: AsyncSession, *, request_id: int, comment: str | None, role: str, user_id: int, actor
) -> LeaveRequestOut:
    request = await _load_for_review(session, request_id=request_id, role=role, user_id=user_id)
    if request.status != LeaveStatus.PENDING.value:
        raise conflict(f"Only pending requests can be denied (current: {request.status})")
    if not comment or not comment.strip():
        raise bad_request("A reason is required when denying a request")

    request.status = LeaveStatus.DENIED.value
    request.reviewed_by = actor.id
    request.reviewed_at = datetime.now(UTC)
    request.review_comment = comment.strip()
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="leave.denied",
        entity_type="leave_request",
        entity_id=request.id,
    )
    return await _output(session, request)


async def cancel_request(
    session: AsyncSession, *, request_id: int, user_id: int, actor
) -> LeaveRequestOut:
    employee = await _require_employee(session, user_id)
    request = await session.get(LeaveRequest, request_id)
    if request is None:
        raise not_found("Leave request")
    if request.employee_id != employee.id:
        raise forbidden()
    if request.status not in (LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value):
        raise conflict(f"This request cannot be cancelled (current: {request.status})")

    if request.status == LeaveStatus.APPROVED.value:
        balance = (
            await session.execute(
                select(LeaveBalance)
                .where(
                    LeaveBalance.employee_id == request.employee_id,
                    LeaveBalance.leave_type_id == request.leave_type_id,
                    LeaveBalance.year == request.from_date.year,
                )
                .with_for_update()
            )
        ).scalar_one_or_none()
        if balance is not None:
            balance.used_days = max(Decimal("0.0"), balance.used_days - request.days)

    request.status = LeaveStatus.CANCELLED.value
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="leave.cancelled",
        entity_type="leave_request",
        entity_id=request.id,
    )
    return await _output(session, request)
