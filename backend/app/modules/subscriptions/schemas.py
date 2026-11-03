from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SubscriptionBase(BaseModel):
    plan: str = "free"
    billing_cycle: str = "monthly"
    amount: Decimal = 0
    currency: str = "INR"
    auto_renew: bool = True
    payment_method: str | None = None
    payment_provider: str | None = None


class SubscriptionCreate(SubscriptionBase):
    tenant_id: int


class SubscriptionUpdate(BaseModel):
    plan: str | None = None
    status: str | None = None
    billing_cycle: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    auto_renew: bool | None = None
    payment_method: str | None = None
    payment_provider: str | None = None
    external_subscription_id: str | None = None
    metadata: dict | None = None


class SubscriptionOut(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    current_period_start: date | None = None
    current_period_end: date | None = None
    trial_end: date | None = None
    cancelled_at: date | None = None
    cancelled_reason: str | None = None
    auto_renew: bool
    payment_method: str | None = None
    payment_provider: str | None = None
    external_subscription_id: str | None = None
    metadata: dict | None = None
    created_at: datetime
    updated_at: datetime


class InvoiceBase(BaseModel):
    subscription_id: int | None = None
    amount: Decimal
    tax_amount: Decimal = 0
    total_amount: Decimal
    currency: str = "INR"
    issue_date: date
    due_date: date


class InvoiceCreate(InvoiceBase):
    tenant_id: int


class InvoiceUpdate(BaseModel):
    status: str | None = None
    paid_at: datetime | None = None
    paid_amount: Decimal | None = None
    payment_method: str | None = None
    payment_reference: str | None = None
    notes: str | None = None


class InvoiceOut(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    subscription_id: int | None = None
    invoice_number: str
    status: str
    paid_at: datetime | None = None
    paid_amount: Decimal
    payment_method: str | None = None
    payment_reference: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
