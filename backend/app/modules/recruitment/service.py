# Recruitment service
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.recruitment.models import Recruitment, Application
from app.modules.recruitment.schemas import (
    RecruitmentCreate,
    RecruitmentUpdate,
    ApplicationCreate,
    ApplicationUpdate,
)


async def list_recruitments(
    session,
    tenant_id: int,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list:
    stmt = select(Recruitment).where(Recruitment.tenant_id == tenant_id)
    if status_filter:
        stmt = stmt.where(Recruitment.status == status_filter)
    stmt = stmt.order_by(Recruitment.created_at.desc()).limit(limit).offset(offset)
    return (await session.execute(stmt)).scalars().all()


async def get_recruitment(session, tenant_id: int, recruitment_id: int):
    stmt = select(Recruitment).where(
        Recruitment.id == recruitment_id,
        Recruitment.tenant_id == tenant_id,
    )
    recruitment = (await session.execute(stmt)).scalar_one_or_none()
    if recruitment is None:
        raise not_found("Recruitment")
    return recruitment


async def create_recruitment(session, tenant_id: int, payload, posted_by: int):
    recruitment = Recruitment(
        tenant_id=tenant_id,
        posted_by=posted_by,
        **payload.model_dump(),
    )
    session.add(recruitment)
    await session.flush()
    await session.refresh(recruitment)
    return recruitment


async def update_recruitment(session, tenant_id: int, recruitment_id: int, payload, user_id: int):
    stmt = select(Recruitment).where(
        Recruitment.id == recruitment_id,
        Recruitment.tenant_id == tenant_id,
    )
    recruitment = (await session.execute(stmt)).scalar_one_or_none()
    if recruitment is None:
        raise not_found("Recruitment")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(recruitment, key, value)
    recruitment.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(recruitment)
    return recruitment


async def apply_to_recruitment(recruitment_id: int, payload):
    # This would be handled by a separate application service
    # For now, we just return a placeholder
    pass


async def list_applications(
    recruitment_id: int,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    # Placeholder
    return []


async def update_application(session, application_id: int, payload, user_id: int):
    # Placeholder
    pass