from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class AnnouncementBase(BaseModel):
    title: str
    content: str
    type: str = "general"
    audience: str = "all"
    target_department_id: Optional[int] = None
    target_user_ids: Optional[List[int]] = None
    is_pinned: bool = False
    is_active: bool = True
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    audience: Optional[str] = None
    target_department_id: Optional[int] = None
    target_user_ids: Optional[List[int]] = None
    is_pinned: Optional[bool] = None
    is_active: Optional[bool] = None
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AnnouncementOut(AnnouncementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    is_pinned: bool
    is_active: bool
    publish_at: Optional[str] = None
    expires_at: Optional[str] = None
    created_by: int
    created_at: str
    updated_at: str


class AnnouncementList(BaseModel):
    items: List[AnnouncementOut]
    total: int
    limit: int
    offset: int