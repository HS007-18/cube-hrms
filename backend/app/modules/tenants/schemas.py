from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.tenants.models import Plan, TenantStatus


class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,78}$")
    plan: Plan = Plan.BASIC
    contact_email: EmailStr
    owner_name: str = Field(min_length=2, max_length=200)
    owner_email: EmailStr


class TenantStatusUpdate(BaseModel):
    status: TenantStatus


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    status: str
    plan: str
    contact_email: str | None
    domain: str | None
    created_at: datetime
    employee_count: int = 0


class TenantDetail(TenantOut):
    owner_name: str | None = None
    owner_email: str | None = None
    pending_leave_requests: int = 0


class CreateTenantResult(BaseModel):
    tenant: TenantOut
    owner_email: str
    temporary_password: str


class ProvisionResult(BaseModel):
    tenant: TenantOut
    owner_email: str
    temporary_password: str | None = None
