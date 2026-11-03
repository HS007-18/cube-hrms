from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict

from pydantic import BaseModel, ConfigDict


class SubscriptionBase(BaseModel):
    plan: str = "free"
    billing_cycle: str = "monthly"
    amount: Decimal = 0
    currency: str = "INR"
    auto_renew: bool = True
    payment_method: Optional[str] = None
    payment_provider: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    tenant_id: int


class SubscriptionUpdate(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    billing_cycle: Optional[str] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    auto_renew: Optional[bool] = None
    payment_method: Optional[str] = None
    payment_provider: Optional[str] = None
    external_subscription_id: Optional[str] = None
    metadata: Optional[Dict] = None


class SubscriptionOut(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    current_period_start: Optional[str] = None
    current_period_end: Optional[str] = None
    trial_end: Optional[str] = None
    cancelled_at: Optional[str] = None
    cancelled_reason: Optional[str] = None
    auto_renew: bool
    payment_method: Optional[str] = None
    payment_provider: Optional[str] = None
    external_subscription_id: Optional[str] = None
    metadata: Optional[Dict] = None
    created_at: str
    updated_at: str


class InvoiceBase(BaseModel):
    subscription_id: Optional[int] = None
    amount: Decimal
    tax_amount: Decimal = 0
    total_amount: Decimal
    currency: str = "INR"
    issue_date: date
    due_date: date


class InvoiceCreate(InvoiceBase):
    tenant_id: int


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None
    paid_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class InvoiceOut(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    subscription_id: Optional[int] = None
    invoice_number: str
    status: str
    paid_at: Optional[str] = None
    paid_amount: Decimal
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str