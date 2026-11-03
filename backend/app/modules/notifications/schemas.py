from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    type: str
    priority: str = "normal"
    title: str
    message: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationOut(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: Optional[int] = None
    user_id: int
    is_read: bool
    read_at: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: str


class NotificationList(BaseModel):
    items: List[NotificationOut]
    total: int
    limit: int
    offset: int


class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    types: List[str] = []