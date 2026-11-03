from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class OnboardingTaskBase(BaseModel):
    title: str
    description: str | None = None
    type: str
    assigned_to: int | None = None
    due_date: date | None = None
    display_order: int = 0


class OnboardingTaskCreate(OnboardingTaskBase):
    onboarding_id: int


class OnboardingTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    assigned_to: int | None = None
    due_date: date | None = None
    status: str | None = None
    display_order: int | None = None


class OnboardingTaskOut(OnboardingTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    onboarding_id: int
    assigned_to: int | None = None
    due_date: date | None = None
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OnboardingBase(BaseModel):
    employee_id: int
    assigned_to: int | None = None
    start_date: date
    expected_completion_date: date | None = None
    notes: str | None = None


class OnboardingCreate(OnboardingBase):
    tasks: list[OnboardingTaskCreate] = []


class OnboardingUpdate(BaseModel):
    assigned_to: int | None = None
    start_date: date | None = None
    expected_completion_date: date | None = None
    actual_completion_date: date | None = None
    status: str | None = None
    notes: str | None = None


class OnboardingOut(OnboardingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    assigned_to: int | None = None
    start_date: date
    expected_completion_date: date | None = None
    actual_completion_date: date | None = None
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class OnboardingDetail(OnboardingOut):
    tasks: list[OnboardingTaskOut] = []