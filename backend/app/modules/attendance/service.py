from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import bad_request, conflict, not_found
from app.modules.attendance.models import AttendanceRecord, AttendanceStatus
from app.modules.attendance.schemas import (
    AttendanceOut,
    ClockResult,
    ManualAttendanceUpdate,
)
from app.modules.audit import service as audit
from app.modules.employees.models import Employee
from app.modules.employees.service import employee_for_user

IST = ZoneInfo("Asia/Kolkata")


def _now() -> datetime:
    return datetime.now(IST)


def business_today() -> date:
    return _now().date()


def _minutes_between(start: time, end: time) -> int:
    start_dt = datetime.combine(date.min, start)
    end_dt = datetime.combine(date.min, end)
    return max(0, int((end_dt - start_dt).total_seconds() // 60))


# Fields that an HR admin is allowed to correct on an attendance record.
CORRECTABLE_FIELDS = {"clock_in", "clock_out", "notes", "status"}


def _to_out(
    record: AttendanceRecord, employee_name: str | None = None
) -> AttendanceOut:
    return AttendanceOut(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=employee_name,
        work_date=record.work_date,
        clock_in=record.clock_in,
        clock_out=record.clock_out,
        status=record.status,
        work_minutes=record.work_minutes,
        notes=record.notes,
        source=record.source,
    )


async def _require_employee(session: AsyncSession, user_id: int) -> Employee:
    employee = await employee_for_user(session, user_id)
    if employee is None:
        raise bad_request("No employee profile is linked to this account")
    return employee


async def _today_record(session: AsyncSession, employee_id: int) -> AttendanceRecord | None:
    return (
        await session.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.work_date == business_today(),
            )
        )
    ).scalar_one_or_none()


async def clock_in(session: AsyncSession, *, user_id: int, actor) -> ClockResult:
    employee = await _require_employee(session, user_id)
    record = await _today_record(session, employee.id)
    now = _now()
    if record is not None:
        if record.clock_in is not None:
            return ClockResult(
                record=_to_out(record, employee.full_name),
                message="Already clocked in today",
            )
        record.clock_in = now.time()
        record.status = AttendanceStatus.PRESENT.value
    else:
        record = AttendanceRecord(
            employee_id=employee.id,
            work_date=now.date(),
            clock_in=now.time(),
            status=AttendanceStatus.PRESENT.value,
            source="web",
        )
        session.add(record)
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="attendance.clock_in",
        entity_type="attendance",
        entity_id=record.id,
    )
    return ClockResult(record=_to_out(record, employee.full_name), message="Clocked in")


async def clock_out(session: AsyncSession, *, user_id: int, actor) -> ClockResult:
    employee = await _require_employee(session, user_id)
    record = await _today_record(session, employee.id)
    if record is None or record.clock_in is None:
        raise bad_request("Clock in before clocking out")
    if record.clock_out is not None:
        raise conflict("You have already clocked out today")
    record.clock_out = _now().time()
    record.work_minutes = _minutes_between(record.clock_in, record.clock_out)
    await session.flush()
    await audit.record(
        session,
        actor=actor,
        action="attendance.clock_out",
        entity_type="attendance",
        entity_id=record.id,
    )
    return ClockResult(record=_to_out(record, employee.full_name), message="Clocked out")


def _month_bounds(month: str | None) -> tuple[date, date]:
    if month is None:
        today = business_today()
        year, month_number = today.year, today.month
    else:
        try:
            year_str, month_str = month.split("-", maxsplit=1)
            year, month_number = int(year_str), int(month_str)
            if not 1 <= month_number <= 12:
                raise ValueError
        except ValueError:
            raise bad_request("Month must be formatted as YYYY-MM") from None
    start = date(year, month_number, 1)
    end = date(year + (month_number == 12), (month_number % 12) + 1, 1)
    return start, end


async def list_my_attendance(
    session: AsyncSession, *, user_id: int, month: str | None = None
) -> list[AttendanceOut]:
    employee = await _require_employee(session, user_id)
    start, end = _month_bounds(month)
    rows = (
        await session.execute(
            select(AttendanceRecord)
            .where(
                AttendanceRecord.employee_id == employee.id,
                AttendanceRecord.work_date >= start,
                AttendanceRecord.work_date < end,
            )
            .order_by(AttendanceRecord.work_date.desc())
        )
    ).scalars()
    return [_to_out(record, employee.full_name) for record in rows]


async def list_attendance(
    session: AsyncSession,
    *,
    role: str,
    user_id: int,
    month: str | None = None,
    employee_id: int | None = None,
) -> list[AttendanceOut]:
    start, end = _month_bounds(month)
    filters = [AttendanceRecord.work_date >= start, AttendanceRecord.work_date < end]
    if employee_id is not None:
        filters.append(AttendanceRecord.employee_id == employee_id)

    if role == "manager":
        manager = await _require_employee(session, user_id)
        team_ids = select(Employee.id).where(Employee.manager_id == manager.id)
        filters.append(AttendanceRecord.employee_id.in_(team_ids))

    rows = (
        await session.execute(
            select(AttendanceRecord, Employee)
            .join(Employee, AttendanceRecord.employee_id == Employee.id)
            .where(*filters)
            .order_by(AttendanceRecord.work_date.desc(), Employee.first_name)
        )
    ).all()
    return [_to_out(record, employee.full_name) for record, employee in rows]


async def correct_record(
    session: AsyncSession, *, record_id: int, payload: ManualAttendanceUpdate, actor
) -> AttendanceOut:
    record = await session.get(AttendanceRecord, record_id)
    if record is None:
        raise not_found("Attendance record")

    changes = {
        k: v
        for k, v in payload.model_dump(exclude_unset=True).items()
        if k in CORRECTABLE_FIELDS
    }
    for field, value in changes.items():
        setattr(record, field, value)
    if record.clock_in is not None and record.clock_out is not None:
        record.work_minutes = _minutes_between(record.clock_in, record.clock_out)

    await session.flush()
    employee = await session.get(Employee, record.employee_id)
    await audit.record(
        session,
        actor=actor,
        action="attendance.corrected",
        entity_type="attendance",
        entity_id=record.id,
        meta={"fields": sorted(changes.keys())},
    )
    return _to_out(record, employee.full_name if employee else None)
