import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AnnouncementType(str, enum.Enum):
    GENERAL = "general"
    POLICY = "policy"
    EVENT = "event"
    MAINTENANCE = "maintenance"
    EMERGENCY = "emergency"


class AnnouncementAudience(str, enum.Enum):
    ALL = "all"
    TENANT = "tenant"
    DEPARTMENT = "department"
    TEAM = "team"
    INDIVIDUAL = "individual"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="general")
    audience: Mapped[str] = mapped_column(String(20), nullable=False, default="all")
    target_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), index=True
    )
    target_user_ids: Mapped[list[int] | None] = mapped_column(JSON, default=None, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    publish_at: Mapped[datetime | None] = None
    expires_at: Mapped[datetime | None] = None
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )