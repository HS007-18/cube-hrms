from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PlatformAuditLogBase(BaseModel):
    actor_user_id: int
    tenant_id: int | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    old_values: dict | None = None
    new_values: dict | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    request_id: str | None = None


class PlatformAuditLogCreate(PlatformAuditLogBase):
    pass


class PlatformAuditLogOut(PlatformAuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PlatformAuditLogList(BaseModel):
    items: list["PlatformAuditLogOut"]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)