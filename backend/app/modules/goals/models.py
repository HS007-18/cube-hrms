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


class GoalStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GoalType(str, enum.Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    DEPARTMENT = "department"
    COMPANY = "company"


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), index=True
    )
    team_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = None
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="individual")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    current_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    unit: Mapped[str | None] = mapped_column(String(20))  # %, count, revenue, etc.
    weight: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    parent_goal_id: Mapped[int | None] = mapped_column(
        ForeignKey("goals.id", ondelete="SET NULL"), index=True
    )
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    reviewer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class GoalReviewStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GoalReview(Base):
    __tablename__ = "goal_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    rating: Mapped[int | None] = None  # 1-5 scale
    achievements: Mapped[str | None] = None
    improvements: Mapped[str | None] = None
    reviewer_comments: Mapped[str | None] = None
    employee_self_assessment: Mapped[str | None] = None
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    reviewed_at: Mapped[datetime | None] = None
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )