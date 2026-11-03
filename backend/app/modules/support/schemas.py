from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TicketCommentBase(BaseModel):
    content: str
    is_internal: bool = False


class TicketCommentCreate(TicketCommentBase):
    ticket_id: int
    user_id: int


class TicketCommentOut(TicketCommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    ticket_id: int
    user_id: int
    is_internal: bool
    created_at: datetime
    updated_at: datetime


class SupportTicketBase(BaseModel):
    title: str
    description: str
    category: str = "other"
    priority: str = "normal"


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    priority: str | None = None
    status: str | None = None
    assigned_to: int | None = None
    resolution_notes: str | None = None


class SupportTicketOut(SupportTicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    user_id: int
    priority: str
    status: str
    assigned_to: int | None = None
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    resolution_notes: str | None = None
    created_at: datetime
    updated_at: datetime


class SupportTicketDetail(SupportTicketOut):
    comments: list[TicketCommentOut] = []


class SupportTicketList(BaseModel):
    items: list[SupportTicketOut]
    total: int
    limit: int
    offset: int