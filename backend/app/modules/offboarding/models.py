import enum
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class OffboardingStatus(str, enum.Enum):
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OffboardingType(str, enum.Enum):
    RESIGNATION = "resignation"
    TERMINATION = "termination"
    RETIREMENT = "retirement"
    CONTRACT_END = "contract_end"
    MUTUAL = "mutual"


class Offboarding(Base):
    __tablename__ = "offboardings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    initiated_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    last_working_date: Mapped[date] = mapped_column(Date, nullable=False)
    notice_period_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    reason: Mapped[str | None] = None
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="initiated", index=True
    )
    exit_interview_scheduled: Mapped[bool | None] = None
    exit_interview_notes: Mapped[str | None] = None
    final_settlement_amount: Mapped[int | None] = None
    settlement_details: Mapped[str | None] = None
    asset_returned: Mapped[bool | None] = None
    access_revoked: Mapped[bool | None] = None
    completed_at: Mapped[datetime | None] = None
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class OffboardingTaskType(str, enum.Enum):
    KNOWLEDGE_TRANSFER = "knowledge_transfer"
    ASSET_RETURN = "asset_return"
    ACCESS_REVOCATION = "access_revocation"
    EXIT_INTERVIEW = "exit_interview"
    FINAL_SETTLEMENT = "final_settlement"
    REFERENCE_LETTER = "reference_letter"
    OTHER = "other"


class OffboardingTaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class OffboardingTask(Base):
    __tablename__ = "offboarding_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    offboarding_id: Mapped[int] = mapped_column(
        ForeignKey("offboardings.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = None
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    assigned_to: Mapped[int | None] = None
    due_date: Mapped[date | None] = None
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )
    completed_at: Mapped[datetime | None] = None
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )