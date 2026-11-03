# Platform Audit service
from datetime import datetime
from typing import Optional, List, Dict

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.platform_audit.models import PlatformAuditLog
from app.modules.platform_audit.schemas import PlatformAuditLogCreate


async def list_audit_logs(
    session,
    action: str | None = None,
    tenant_id: int | None = None,
    actor_user_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> dict:
    stmt = select(PlatformAuditLog)
    if action:
        stmt = stmt.where(PlatformAuditLog.action == action)
    if tenant_id:
        stmt = stmt.where(PlatformAuditLog.tenant_id == tenant_id)
    if actor_user_id:
        stmt = stmt.where(PlatformAuditLog.actor_user_id == actor_user_id)
    
    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()
    
    stmt = stmt.order_by(PlatformAuditLog.created_at.desc()).limit(limit).offset(offset)
    items = (await session.execute(stmt)).scalars().all()
    
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def get_audit_log(session, audit_id: int) -> PlatformAuditLog:
    stmt = select(PlatformAuditLog).where(PlatformAuditLog.id == audit_id)
    audit = (await session.execute(stmt)).scalar_one_or_none()
    if audit is None:
        raise not_found("AuditLog")
    return audit


async def create_audit_log(session, payload: PlatformAuditLogCreate) -> PlatformAuditLog:
    audit = PlatformAuditLog(**payload.model_dump())
    session.add(audit)
    await session.flush()
    await session.refresh(audit)
    return audit


async def record_audit(
    session,
    actor_user_id: int,
    action: str,
    tenant_id: int | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    request_id: str | None = None,
) -> PlatformAuditLog:
    audit = PlatformAuditLog(
        actor_user_id=actor_user_id,
        tenant_id=tenant_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
    )
    session.add(audit)
    await session.flush()
    return audit