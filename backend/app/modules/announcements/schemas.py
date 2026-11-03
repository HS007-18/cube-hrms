from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnnouncementBase(BaseModel):
    title: str
    content: str
    type: str = "general"
    audience: str = "all"
    target_department_id: int | None = None
    target_user_ids: list[int] | None = None
    is_pinned: bool = False
    is_active: bool = True
    publish_at: datetime | None = None
    expires_at: datetime | None = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: str | None = None
    audience: str | None = None
    target_department_id: int | None = None
    target_user_ids: list[int] | None = None
    is_pinned: bool | None = None
    is_active: bool | None = None
    publish_at: datetime | None = None
    expires_at: datetime | None = None


class AnnouncementOut(AnnouncementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    is_pinned: bool
    is_active: bool
    publish_at: datetime | None = None
    expires_at: datetime | None = None
    created_by: int
    created_at: datetime
    updated_at: datetime


class AnnouncementList(BaseModel):
    items: list[AnnouncementOut]
    total: int
    limit: int
    offset: int