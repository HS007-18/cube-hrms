from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LeaveTypeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    code: str = Field(pattern=r"^[a-z0-9_-]{2,30}$")
    annual_quota_days: Decimal = Field(default=Decimal("0"), ge=0, le=366)
    is_paid: bool = True
    carry_forward: bool = False


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    annual_quota_days: Decimal | None = Field(default=None, ge=0, le=366)
    is_paid: bool | None = None
    carry_forward: bool | None = None
    is_active: bool | None = None


class LeaveTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    annual_quota_days: Decimal
    is_paid: bool
    carry_forward: bool
    is_active: bool


class LeaveBalanceOut(BaseModel):
    leave_type_id: int
    leave_type_name: str
    year: int
    total_days: Decimal
    used_days: Decimal
    remaining_days: Decimal


class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    reason: str | None = Field(default=None, max_length=1000)


class ReviewRequest(BaseModel):
    comment: str | None = Field(default=None, max_length=1000)


class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type_name: str
    from_date: date
    to_date: date
    days: Decimal
    reason: str | None
    status: str
    review_comment: str | None
    created_at: datetime


LeaveScope = Literal["mine", "team", "all"]
