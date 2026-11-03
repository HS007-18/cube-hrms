# Onboarding service
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.onboarding.models import Onboarding, OnboardingTask
from app.modules.onboarding.schemas import (
    OnboardingCreate,
    OnboardingUpdate,
    OnboardingTaskCreate,
    OnboardingTaskUpdate,
)


async def list_onboardings(
    session,
    tenant_id: int,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list:
    stmt = select(Onboarding).where(Onboarding.tenant_id == tenant_id)
    if status_filter:
        stmt = stmt.where(Onboarding.status == status_filter)
    stmt = stmt.order_by(Onboarding.created_at.desc()).limit(limit).offset(offset)
    return (await session.execute(stmt)).scalars().all()


async def get_onboarding(session, tenant_id: int, onboarding_id: int) -> Onboarding:
    stmt = select(Onboarding).where(
        Onboarding.id == onboarding_id,
        Onboarding.tenant_id == tenant_id,
    )
    onboarding = (await session.execute(stmt)).scalar_one_or_none()
    if onboarding is None:
        raise not_found("Onboarding")
    return onboarding


async def create_onboarding(
    session, tenant_id: int, payload, created_by: int
) -> Onboarding:
    onboarding = Onboarding(
        tenant_id=tenant_id,
        employee_id=payload.employee_id,
        assigned_to=payload.assigned_to,
        start_date=payload.start_date,
        expected_completion_date=payload.expected_completion_date,
        status="pending",
        notes=payload.notes,
    )
    session.add(onboarding)
    await session.flush()
    
    # Create tasks
    for task_payload in payload.tasks:
        task = OnboardingTask(
            tenant_id=tenant_id,
            onboarding_id=onboarding.id,
            **task_payload.model_dump(),
        )
        session.add(task)
    
    await session.flush()
    await session.refresh(onboarding)
    return onboarding


async def update_onboarding(
    session, tenant_id: int, onboarding_id: int, payload, user_id: int
) -> Onboarding:
    onboarding = await get_onboarding(session, tenant_id, onboarding_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(onboarding, key, value)
    onboarding.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(onboarding)
    return onboarding


async def add_task(
    session, tenant_id: int, onboarding_id: int, payload, user_id: int
) -> OnboardingTask:
    onboarding = await get_onboarding(session, tenant_id, onboarding_id)
    task = OnboardingTask(
        tenant_id=tenant_id,
        onboarding_id=onboarding_id,
        **payload.model_dump(),
    )
    session.add(task)
    await session.flush()
    await session.refresh(task)
    return task


async def update_task(
    session, tenant_id: int, task_id: int, payload, user_id: int
) -> OnboardingTask:
    stmt = select(OnboardingTask).where(
        OnboardingTask.id == task_id,
        OnboardingTask.tenant_id == tenant_id,
    )
    task = (await session.execute(stmt)).scalar_one_or_none()
    if task is None:
        raise not_found("OnboardingTask")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    if payload.status == "completed":
        task.completed_at = datetime.utcnow()
    await session.flush()
    await session.refresh(task)
    return task