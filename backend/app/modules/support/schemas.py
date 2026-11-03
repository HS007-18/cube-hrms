from datetime import datetime
from typing import Optional, List

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
    created_at: str
    updated_at: str


class SupportTicketBase(BaseModel):
    title: str
    description: str
    category: str = "other"
    priority: str = "normal"


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None


class SupportTicketOut(SupportTicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    user_id: int
    priority: str
    status: str
    assigned_to: Optional[int] = None
    resolved_at: Optional[str] = None
    closed_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: str
    updated_at: str


class SupportTicketDetail(SupportTicketOut):
    comments: List[TicketCommentOut] = []


class SupportTicketList(BaseModel):
    items: List[SupportTicketOut]
    total: int
    limit: int
    offset: int