from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel, ConfigDict


class PlatformAuditLogBase(BaseModel):
    actor_user_id: int
    tenant_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    old_values: Optional[Dict] = None
    new_values: Optional[Dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None


class PlatformAuditLogCreate(PlatformAuditLogBase):
    pass


class PlatformAuditLogOut(PlatformAuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str


class PlatformAuditLogList(BaseModel):
    items: List["PlatformAuditLogOut"]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)