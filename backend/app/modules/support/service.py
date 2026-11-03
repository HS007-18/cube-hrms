# Support service
from datetime import datetime
from typing import Optional, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.support.models import SupportTicket, TicketComment
from app.modules.support.schemas import (
    SupportTicketCreate,
    SupportTicketUpdate,
    TicketCommentCreate,
)


async def list_tickets(
    session,
    tenant_id: int,
    user_id: int,
    user_role: str,
    status_filter: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    stmt = select(SupportTicket).where(SupportTicket.tenant_id == tenant_id)
    
    if user_role != "hr_admin" and user_role != "manager":
        stmt = stmt.where(SupportTicket.user_id == user_id)
    
    if status_filter:
        stmt = stmt.where(SupportTicket.status == status_filter)
    if category:
        stmt = stmt.where(SupportTicket.category == category)
    if priority:
        stmt = stmt.where(SupportTicket.priority == priority)
    
    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()
    
    stmt = stmt.order_by(SupportTicket.created_at.desc()).limit(limit).offset(offset)
    items = (await session.execute(stmt)).scalars().all()
    
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def get_ticket(session, tenant_id: int, ticket_id: int, user_id: int, user_role: str):
    stmt = select(SupportTicket).where(
        SupportTicket.id == ticket_id,
        SupportTicket.tenant_id == tenant_id,
    )
    ticket = (await session.execute(stmt)).scalar_one_or_none()
    if ticket is None:
        raise not_found("SupportTicket")
    
    if user_role not in ["hr_admin", "manager"] and ticket.user_id != user_id:
        raise not_found("SupportTicket")
    
    return ticket


async def create_ticket(session, tenant_id: int, user_id: int, payload):
    ticket = SupportTicket(
        tenant_id=tenant_id,
        user_id=user_id,
        **payload.model_dump(),
    )
    session.add(ticket)
    await session.flush()
    await session.refresh(ticket)
    return ticket


async def update_ticket(session, tenant_id: int, ticket_id: int, payload, user_id: int, user_role: str):
    ticket = await get_ticket(session, tenant_id, ticket_id, user_id, user_role)
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    ticket.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(ticket)
    return ticket


async def add_comment(session, tenant_id: int, ticket_id: int, user_id: int, payload, user_role: str):
    ticket = await get_ticket(session, tenant_id, ticket_id, user_id, user_role)
    
    comment = TicketComment(
        tenant_id=tenant_id,
        ticket_id=ticket_id,
        user_id=user_id,
        **payload.model_dump(),
    )
    session.add(comment)
    await session.flush()
    await session.refresh(comment)
    return comment


async def assign_ticket(session, tenant_id: int, ticket_id: int, assigned_to: int, user_id: int):
    ticket = await get_ticket(session, tenant_id, ticket_id, user_id, "hr_admin")
    ticket.assigned_to = assigned_to
    ticket.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(ticket)
    return ticket


async def resolve_ticket(session, tenant_id: int, ticket_id: int, resolution_notes: str, user_id: int):
    ticket = await get_ticket(session, tenant_id, ticket_id, user_id, "hr_admin")
    ticket.status = "resolved"
    ticket.resolved_at = datetime.utcnow()
    ticket.resolution_notes = resolution_notes
    await session.flush()
    await session.refresh(ticket)
    return ticket


async def reopen_ticket(session, tenant_id: int, ticket_id: int, user_id: int):
    ticket = await get_ticket(session, tenant_id, ticket_id, user_id, "hr_admin")
    ticket.status = "reopened"
    ticket.resolved_at = None
    ticket.resolution_notes = None
    await session.flush()
    await session.refresh(ticket)
    return ticket