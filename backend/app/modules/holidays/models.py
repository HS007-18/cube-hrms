import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class HolidayType(str, enum.Enum):
    PUBLIC = "public"
    RESTRICTED = "restricted"
    OPTIONAL = "optional"
    COMPANY = "company"


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default=HolidayType.PUBLIC.value)
    description: Mapped[str | None] = mapped_column(String(500))
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    applies_to_all: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )