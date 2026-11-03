from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PayrollItemBase(BaseModel):
    name: str
    type: str  # earning/deduction
    amount: Decimal
    is_taxable: bool = True
    display_order: int = 0


class PayrollItemCreate(PayrollItemBase):
    employee_id: int


class PayrollItemUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    amount: Decimal | None = None
    is_taxable: bool | None = None
    display_order: int | None = None


class PayrollItemOut(PayrollItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    payroll_id: int
    employee_id: int
    created_at: datetime


class PayrollBase(BaseModel):
    period_start: date
    period_end: date
    notes: str | None = None


class PayrollCreate(PayrollBase):
    pass


class PayrollUpdate(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    status: str | None = None
    notes: str | None = None


class PayrollOut(PayrollBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    processed_by: int | None = None
    processed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PayrollDetail(PayrollOut):
    items: list[PayrollItemOut] = []


class PayrollProcessRequest(BaseModel):
    payroll_id: int