from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class OnboardingTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    display_order: int = 0


class OnboardingTaskCreate(OnboardingTaskBase):
    onboarding_id: int


class OnboardingTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    display_order: Optional[int] = None


class OnboardingTaskOut(OnboardingTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    onboarding_id: int
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None
    status: str
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class OnboardingBase(BaseModel):
    employee_id: int
    assigned_to: Optional[int] = None
    start_date: date
    expected_completion_date: Optional[date] = None
    notes: Optional[str] = None


class OnboardingCreate(OnboardingBase):
    tasks: List[OnboardingTaskCreate] = []


class OnboardingUpdate(BaseModel):
    assigned_to: Optional[int] = None
    start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class OnboardingOut(OnboardingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    assigned_to: Optional[int] = None
    start_date: str
    expected_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class OnboardingDetail(OnboardingOut):
    tasks: List[OnboardingTaskOut] = []