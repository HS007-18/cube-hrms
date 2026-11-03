# Announcements service
from datetime import datetime
from typing import Optional, List

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.announcements.models import Announcement
from app.modules.announcements.schemas import AnnouncementCreate, AnnouncementUpdate


async def list_announcements(
    session,
    tenant_id: int,
    is_active: bool | None = None,
    audience: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    stmt = select(Announcement).where(Announcement.tenant_id == tenant_id)
    if is_active is not None:
        stmt = stmt.where(Announcement.is_active == is_active)
    if audience:
        stmt = stmt.where(Announcement.audience == audience)
    
    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()
    
    stmt = stmt.order_by(Announcement.created_at.desc()).limit(limit).offset(offset)
    items = (await session.execute(stmt)).scalars().all()
    
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def get_announcement(session, tenant_id: int, announcement_id: int) -> Announcement:
    stmt = select(Announcement).where(
        Announcement.id == announcement_id,
        Announcement.tenant_id == tenant_id,
    )
    announcement = (await session.execute(stmt)).scalar_one_or_none()
    if announcement is None:
        raise not_found("Announcement")
    return announcement


async def create_announcement(session, tenant_id: int, payload, created_by: int) -> Announcement:
    announcement = Announcement(
        tenant_id=tenant_id,
        **payload.model_dump(),
        created_by=created_by,
    )
    session.add(announcement)
    await session.flush()
    await session.refresh(announcement)
    return announcement


async def update_announcement(session, tenant_id: int, announcement_id: int, payload, user_id: int) -> Announcement:
    announcement = await get_announcement(session, tenant_id, announcement_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(announcement, key, value)
    announcement.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(announcement)
    return announcement


async def delete_announcement(session, tenant_id: int, announcement_id: int) -> None:
    announcement = await get_announcement(session, tenant_id, announcement_id)
    await session.delete(announcement)