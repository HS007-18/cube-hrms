# Offboarding service
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.offboarding.models import Offboarding, OffboardingTask
from app.modules.offboarding.schemas import (
    OffboardingCreate,
    OffboardingUpdate,
    OffboardingTaskCreate,
    OffboardingTaskUpdate,
)


async def list_offboardings(
    session,
    tenant_id: int,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Offboarding]:
    stmt = select(Offboarding).where(Offboarding.tenant_id == tenant_id)
    if status_filter:
        stmt = stmt.where(Offboarding.status == status_filter)
    stmt = stmt.order_by(Offboarding.created_at.desc()).limit(limit).offset(offset)
    return (await session.execute(stmt)).scalars().all()


async def get_offboarding(session, tenant_id: int, offboarding_id: int) -> Offboarding:
    stmt = select(Offboarding).where(
        Offboarding.id == offboarding_id,
        Offboarding.tenant_id == tenant_id,
    )
    offboarding = (await session.execute(stmt)).scalar_one_or_none()
    if offboarding is None:
        raise not_found("Offboarding")
    return offboarding


async def create_offboarding(
    session,
    tenant_id: int,
    payload,
    initiated_by: int,
    is_resignation: bool = False,
) -> Offboarding:
    # Create offboarding record
    offboarding = Offboarding(
        tenant_id=tenant_id,
        employee_id=payload.employee_id,
        type=payload.type,
        initiated_by=initiated_by,
        last_working_date=payload.last_working_date,
        notice_period_days=payload.notice_period_days,
        reason=payload.reason,
        status="initiated",
    )
    session.add(offboarding)
    await session.flush()
    
    # Create tasks
    for task_payload in payload.tasks:
        task = OffboardingTask(
            tenant_id=tenant_id,
            offboarding_id=offboarding.id,
            **task_payload.model_dump(),
        )
        session.add(task)
    
    await session.flush()
    await session.refresh(offboarding)
    return offboarding


async def update_offboarding(
    session, tenant_id: int, offboarding_id: int, payload, user_id: int
) -> Offboarding:
    offboarding = await get_offboarding(session, tenant_id, offboarding_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(offboarding, key, value)
    offboarding.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(offboarding)
    return offboarding


async def add_task(
    session, tenant_id: int, offboarding_id: int, payload, user_id: int
) -> OffboardingTask:
    offboarding = await get_offboarding(session, tenant_id, offboarding_id)
    task = OffboardingTask(
        tenant_id=tenant_id,
        offboarding_id=offboarding_id,
        **payload.model_dump(),
    )
    session.add(task)
    await session.flush()
    await session.refresh(task)
    return task


async def update_task(
    session, tenant_id: int, task_id: int, payload, user_id: int
) -> OffboardingTask:
    stmt = select(OffboardingTask).where(
        OffboardingTask.id == task_id,
        OffboardingTask.tenant_id == tenant_id,
    )
    task = (await session.execute(stmt)).scalar_one_or_none()
    if task is None:
        raise not_found("OffboardingTask")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    if payload.status == "completed":
        task.completed_at = datetime.utcnow()
    await session.flush()
    await session.refresh(task)
    return task