from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class OffboardingTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    display_order: int = 0


class OffboardingTaskCreate(OffboardingTaskBase):
    offboarding_id: int


class OffboardingTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    display_order: Optional[int] = None


class OffboardingTaskOut(OffboardingTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    offboarding_id: int
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None
    status: str
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class OffboardingBase(BaseModel):
    employee_id: int
    type: str
    last_working_date: date
    notice_period_days: int = 30
    reason: Optional[str] = None


class OffboardingCreate(OffboardingBase):
    tasks: List[OffboardingTaskCreate] = []


class OffboardingUpdate(BaseModel):
    type: Optional[str] = None
    last_working_date: Optional[date] = None
    notice_period_days: Optional[int] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    exit_interview_scheduled: Optional[bool] = None
    exit_interview_notes: Optional[str] = None
    final_settlement_amount: Optional[int] = None
    settlement_details: Optional[str] = None
    asset_returned: Optional[bool] = None
    access_revoked: Optional[bool] = None


class OffboardingOut(OffboardingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    initiated_by: int
    status: str
    exit_interview_scheduled: Optional[bool] = None
    exit_interview_notes: Optional[str] = None
    final_settlement_amount: Optional[int] = None
    settlement_details: Optional[str] = None
    asset_returned: Optional[bool] = None
    access_revoked: Optional[bool] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class OffboardingDetail(OffboardingOut):
    tasks: List[OffboardingTaskOut] = []