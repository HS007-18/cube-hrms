from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class OffboardingTaskBase(BaseModel):
    title: str
    description: str | None = None
    type: str
    assigned_to: int | None = None
    due_date: date | None = None
    display_order: int = 0


class OffboardingTaskCreate(OffboardingTaskBase):
    offboarding_id: int


class OffboardingTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    assigned_to: int | None = None
    due_date: date | None = None
    status: str | None = None
    display_order: int | None = None


class OffboardingTaskOut(OffboardingTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    offboarding_id: int
    assigned_to: int | None = None
    due_date: date | None = None
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OffboardingBase(BaseModel):
    employee_id: int
    type: str
    last_working_date: date
    notice_period_days: int = 30
    reason: str | None = None


class OffboardingCreate(OffboardingBase):
    tasks: list[OffboardingTaskCreate] = []


class OffboardingUpdate(BaseModel):
    type: str | None = None
    last_working_date: date | None = None
    notice_period_days: int | None = None
    reason: str | None = None
    status: str | None = None
    exit_interview_scheduled: bool | None = None
    exit_interview_notes: str | None = None
    final_settlement_amount: int | None = None
    settlement_details: str | None = None
    asset_returned: bool | None = None
    access_revoked: bool | None = None


class OffboardingOut(OffboardingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    initiated_by: int
    status: str
    exit_interview_scheduled: bool | None = None
    exit_interview_notes: str | None = None
    final_settlement_amount: int | None = None
    settlement_details: str | None = None
    asset_returned: bool | None = None
    access_revoked: bool | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OffboardingDetail(OffboardingOut):
    tasks: list[OffboardingTaskOut] = []