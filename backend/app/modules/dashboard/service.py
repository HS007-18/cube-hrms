"""Role-aware dashboard metrics. Every number is computed inside RLS scope."""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.attendance.models import AttendanceRecord, AttendanceStatus
from app.modules.attendance.service import business_today
from app.modules.dashboard.schemas import Metric, Summary
from app.modules.employees.models import Employee
from app.modules.employees.service import employee_for_user
from app.modules.leave.models import LeaveBalance, LeaveRequest, LeaveStatus


async def _count(session: AsyncSession, query) -> int:
    return int((await session.execute(query)).scalar_one())


async def _my_employee_id(session: AsyncSession, user_id: int) -> int | None:
    employee = await employee_for_user(session, user_id)
    return employee.id if employee else None


async def summary(session: AsyncSession, *, user) -> Summary:
    today = business_today()
    month_start = date(today.year, today.month, 1)
    employee_id = await _my_employee_id(session, user.id)

    my_pending = (
        await _count(
            session,
            select(func.count())
            .select_from(LeaveRequest)
            .where(
                LeaveRequest.employee_id == employee_id if employee_id else -1,
                LeaveRequest.status == LeaveStatus.PENDING.value,
            ),
        )
        if employee_id
        else 0
    )

    if user.role == "hr_admin":
        headcount = await _count(
            session,
            select(func.count())
            .select_from(Employee)
            .where(Employee.is_active.is_(True)),
        )
        present_today = await _count(
            session,
            select(func.count())
            .select_from(AttendanceRecord)
            .where(
                AttendanceRecord.work_date == today,
                AttendanceRecord.status == AttendanceStatus.PRESENT.value,
            ),
        )
        pending_requests = await _count(
            session,
            select(func.count())
            .select_from(LeaveRequest)
            .where(LeaveRequest.status == LeaveStatus.PENDING.value),
        )
        on_leave_today = await _count(
            session,
            select(func.count())
            .select_from(LeaveRequest)
            .where(
                LeaveRequest.status == LeaveStatus.APPROVED.value,
                LeaveRequest.from_date <= today,
                LeaveRequest.to_date >= today,
            ),
        )
        metrics = [
            Metric(key="headcount", label="Active employees", value=headcount),
            Metric(key="present_today", label="Present today", value=present_today),
            Metric(
                key="pending_approvals", label="Pending leave approvals", value=pending_requests
            ),
            Metric(key="on_leave", label="On leave today", value=on_leave_today),
        ]
        return Summary(role=user.role, date=today, metrics=metrics)

    if user.role == "manager" and employee_id:
        team_ids = select(Employee.id).where(
            Employee.manager_id == employee_id, Employee.is_active.is_(True)
        )
        team_size = await _count(
            session, select(func.count()).select_from(Employee).where(Employee.id.in_(team_ids))
        )
        team_present = await _count(
            session,
            select(func.count())
            .select_from(AttendanceRecord)
            .where(
                AttendanceRecord.employee_id.in_(team_ids),
                AttendanceRecord.work_date == today,
                AttendanceRecord.status == AttendanceStatus.PRESENT.value,
            ),
        )
        team_pending = await _count(
            session,
            select(func.count())
            .select_from(LeaveRequest)
            .where(
                LeaveRequest.employee_id.in_(team_ids),
                LeaveRequest.status == LeaveStatus.PENDING.value,
            ),
        )
        metrics = [
            Metric(key="team_size", label="Team members", value=team_size),
            Metric(key="team_present", label="Team present today", value=team_present),
            Metric(key="team_pending", label="Team leave requests", value=team_pending),
            Metric(key="my_pending", label="My pending requests", value=my_pending),
        ]
        return Summary(role=user.role, date=today, metrics=metrics)

    # Employee self-service home.
    present_days = (
        await _count(
            session,
            select(func.count())
            .select_from(AttendanceRecord)
            .where(
                AttendanceRecord.employee_id == employee_id if employee_id else -1,
                AttendanceRecord.work_date >= month_start,
                AttendanceRecord.status == AttendanceStatus.PRESENT.value,
            ),
        )
        if employee_id
        else 0
    )
    remaining = Decimal("0.0")
    if employee_id:
        row = (
            await session.execute(
                select(
                    func.coalesce(func.sum(LeaveBalance.total_days - LeaveBalance.used_days), 0)
                ).where(
                    LeaveBalance.employee_id == employee_id,
                    LeaveBalance.year == today.year,
                )
            )
        ).scalar_one()
        remaining = Decimal(row or 0)
    metrics = [
        Metric(key="present_days", label="Days present this month", value=present_days),
        Metric(key="leave_remaining", label="Leave days remaining", value=float(remaining)),
        Metric(key="my_pending", label="My pending requests", value=my_pending),
        Metric(key="headcount", label="Company headcount", value=await _count(
            session,
            select(func.count()).select_from(Employee).where(Employee.is_active.is_(True)),
        )),
    ]
    return Summary(role=user.role, date=today, metrics=metrics)
