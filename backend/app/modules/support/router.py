from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.support import service
from app.modules.support.schemas import (
    SupportTicketCreate,
    SupportTicketDetail,
    SupportTicketList,
    SupportTicketOut,
    SupportTicketUpdate,
    TicketCommentCreate,
    TicketCommentOut,
)

router = APIRouter(prefix="/support", tags=["support"])


@router.get("", response_model=SupportTicketList)
async def list_tickets(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = Query(None),
    priority: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_tickets(ctx.session, ctx.tenant_id, ctx.user_id, ctx.user.role, status_filter, category, priority, limit, offset)


@router.post("", response_model=SupportTicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: SupportTicketCreate,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.create_ticket(ctx.session, ctx.tenant_id, ctx.user_id, payload)


@router.get("/{ticket_id}", response_model=SupportTicketDetail)
async def get_ticket(
    ticket_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_ticket(ctx.session, ctx.tenant_id, ticket_id, ctx.user_id, ctx.user.role)


@router.patch("/{ticket_id}", response_model=SupportTicketOut)
async def update_ticket(
    ticket_id: int,
    payload: SupportTicketUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_ticket(ctx.session, ctx.tenant_id, ticket_id, payload, ctx.user.id, ctx.user.role)


@router.post("/{ticket_id}/comments", response_model=TicketCommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(
    ticket_id: int,
    payload: TicketCommentCreate,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.add_comment(ctx.session, ctx.tenant_id, ticket_id, ctx.user_id, payload, ctx.user.role)


@router.patch("/{ticket_id}/assign", response_model=SupportTicketOut)
async def assign_ticket(
    ticket_id: int,
    assigned_to: int,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.assign_ticket(ctx.session, ctx.tenant_id, ticket_id, assigned_to, ctx.user.id)


@router.post("/{ticket_id}/resolve", response_model=SupportTicketOut)
async def resolve_ticket(
    ticket_id: int,
    resolution_notes: str,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.resolve_ticket(ctx.session, ctx.tenant_id, ticket_id, resolution_notes, ctx.user.id)


@router.post("/{ticket_id}/reopen", response_model=SupportTicketOut)
async def reopen_ticket(
    ticket_id: int,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.reopen_ticket(ctx.session, ctx.tenant_id, ticket_id, ctx.user.id)