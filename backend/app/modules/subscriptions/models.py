import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    TRIALING = "trialing"
    EXPIRED = "expired"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    plan: Mapped[str] = mapped_column(String(30), nullable=False, default="free")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", index=True
    )
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False, default="monthly")  # monthly, yearly
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    current_period_start: Mapped[date | None] = None
    current_period_end: Mapped[date | None] = None
    trial_end: Mapped[date | None] = None
    cancelled_at: Mapped[date | None] = None
    cancelled_reason: Mapped[str | None] = None
    auto_renew: bool = True
    payment_method: Mapped[str | None] = None
    payment_provider: Mapped[str | None] = None  # stripe, razorpay, etc.
    external_subscription_id: Mapped[str | None] = None  # provider's subscription ID
    meta_data: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    subscription_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), index=True
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    paid_at: Mapped[datetime | None] = None
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    payment_method: Mapped[str | None] = None
    payment_reference: Mapped[str | None] = None
    notes: Mapped[str | None] = None
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )