from datetime import date
from decimal import Decimal
from typing import Optional, List

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
    name: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[Decimal] = None
    is_taxable: Optional[bool] = None
    display_order: Optional[int] = None


class PayrollItemOut(PayrollItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    payroll_id: int
    employee_id: int
    created_at: str


class PayrollBase(BaseModel):
    period_start: date
    period_end: date
    notes: Optional[str] = None


class PayrollCreate(PayrollBase):
    pass


class PayrollUpdate(BaseModel):
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PayrollOut(PayrollBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    processed_by: Optional[int] = None
    processed_at: Optional[str] = None
    created_at: str
    updated_at: str


class PayrollDetail(PayrollOut):
    items: List[PayrollItemOut] = []


class PayrollProcessRequest(BaseModel):
    payroll_id: int