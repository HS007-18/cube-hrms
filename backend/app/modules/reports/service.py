# Reports service
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.reports.models import Report, ReportSchedule
from app.modules.reports.schemas import (
    ReportCreate,
    ReportUpdate,
    ReportScheduleCreate,
    ReportScheduleUpdate,
)


async def list_reports(
    session,
    tenant_id: int,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    stmt = select(Report).where(Report.tenant_id == tenant_id)
    if status_filter:
        stmt = stmt.where(Report.status == status_filter)
    
    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()
    
    stmt = stmt.order_by(Report.created_at.desc()).limit(limit).offset(offset)
    items = (await session.execute(stmt)).scalars().all()
    
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def get_report(session, tenant_id: int, report_id: int):
    stmt = select(Report).where(
        Report.id == report_id,
        Report.tenant_id == tenant_id,
    )
    report = (await session.execute(stmt)).scalar_one_or_none()
    if report is None:
        raise not_found("Report")
    return report


async def create_report(session, tenant_id: int, user_id: int, payload, background_tasks):
    report = Report(
        tenant_id=tenant_id,
        generated_by=user_id,
        **payload.model_dump(),
    )
    session.add(report)
    await session.flush()
    
    # Generate report in background
    background_tasks.add_task(generate_report_task, report.id)
    
    await session.flush()
    await session.refresh(report)
    return report


async def update_report(session, tenant_id: int, report_id: int, payload):
    stmt = select(Report).where(
        Report.id == report_id,
        Report.tenant_id == tenant_id,
    )
    report = (await session.execute(stmt)).scalar_one_or_none()
    if report is None:
        raise not_found("Report")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, key, value)
    report.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(report)
    return report


async def generate_report(session, tenant_id: int, report_id: int, background_tasks):
    report = await get_report(session, tenant_id, report_id)
    report.status = "generating"
    await session.flush()
    
    # In production, this would generate the actual report
    # For now, just mark as completed
    report.status = "completed"
    report.generated_at = datetime.utcnow()
    await session.flush()
    return report


async def generate_report_task(report_id: int):
    # Background task to generate report
    pass


async def get_report(session, tenant_id: int, report_id: int):
    stmt = select(Report).where(
        Report.id == report_id,
        Report.tenant_id == tenant_id,
    )
    report = (await session.execute(stmt)).scalar_one_or_none()
    if report is None:
        raise not_found("Report")
    return report


async def update_report(session, tenant_id: int, report_id: int, payload):
    report = await get_report(session, tenant_id, report_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, key, value)
    report.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(report)
    return report


async def list_schedules(session, tenant_id: int):
    stmt = select(ReportSchedule).where(ReportSchedule.tenant_id == tenant_id)
    return (await session.execute(stmt)).scalars().all()


async def create_schedule(session, tenant_id: int, user_id: int, payload):
    schedule = ReportSchedule(
        tenant_id=tenant_id,
        created_by=user_id,
        **payload.model_dump(),
    )
    session.add(schedule)
    await session.flush()
    await session.refresh(schedule)
    return schedule


async def update_schedule(session, tenant_id: int, schedule_id: int, payload):
    stmt = select(ReportSchedule).where(
        ReportSchedule.id == schedule_id,
        ReportSchedule.tenant_id == tenant_id,
    )
    schedule = (await session.execute(stmt)).scalar_one_or_none()
    if schedule is None:
        raise not_found("ReportSchedule")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, key, value)
    schedule.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(schedule)
    return schedule


async def run_schedule(session, tenant_id: int, schedule_id: int, background_tasks):
    stmt = select(ReportSchedule).where(
        ReportSchedule.id == schedule_id,
        ReportSchedule.tenant_id == tenant_id,
    )
    schedule = (await session.execute(stmt)).scalar_one_or_none()
    if schedule is None:
        raise not_found("ReportSchedule")
    
    # Generate report from schedule
    background_tasks.add_task(generate_scheduled_report, schedule.id)
    return schedule


async def generate_scheduled_report(schedule_id: int):
    # Background task
    pass