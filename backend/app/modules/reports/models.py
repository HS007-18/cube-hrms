import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
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


class ReportType(str, enum.Enum):
    ATTENDANCE_SUMMARY = "attendance_summary"
    LEAVE_SUMMARY = "leave_summary"
    PAYROLL_SUMMARY = "payroll_summary"
    EMPLOYEE_DIRECTORY = "employee_directory"
    RECRUITMENT_FUNNEL = "recruitment_funnel"
    LEAVE_TRENDS = "leave_trends"
    ATTENDANCE_TRENDS = "attendance_trends"
    HEADCOUNT = "headcount"
    TURNOVER = "turnover"
    PAYROLL_COST = "payroll_cost"
    PERFORMANCE = "performance"
    COMPLIANCE = "compliance"
    CUSTOM = "custom"


class ReportFormat(str, enum.Enum):
    CSV = "csv"
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    format: Mapped[str] = mapped_column(String(10), nullable=False, default="csv")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    parameters: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    file_path: Mapped[str | None] = None
    file_size: Mapped[int | None] = None
    generated_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    generated_at: Mapped[datetime | None] = None
    expires_at: Mapped[datetime | None] = None
    error_message: Mapped[str | None] = None
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    format: Mapped[str] = mapped_column(String(10), nullable=False, default="csv")
    parameters: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    cron_expression: Mapped[str] = None  # e.g., "0 0 * * 1" for weekly
    is_active: bool = True
    last_run_at: Mapped[datetime | None] = None
    next_run_at: Mapped[datetime | None] = None
    recipients: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )