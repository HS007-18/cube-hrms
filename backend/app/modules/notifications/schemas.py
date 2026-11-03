from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    type: str
    priority: str = "normal"
    title: str
    message: str
    action_url: str | None = None
    action_label: str | None = None
    related_entity_type: str | None = None
    related_entity_id: int | None = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationOut(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int | None = None
    user_id: int
    is_read: bool
    read_at: datetime | None = None
    related_entity_type: str | None = None
    related_entity_id: int | None = None
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationOut]
    total: int
    limit: int
    offset: int


class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    types: list[str] = []