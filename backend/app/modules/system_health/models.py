import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class HealthCheckType(str, enum.Enum):
    DATABASE = "database"
    REDIS = "redis"
    MINIO = "minio"
    EXTERNAL_API = "external_api"
    DISK_SPACE = "disk_space"
    MEMORY = "memory"
    CPU = "cpu"
    QUEUE = "queue"


class HealthStatus(str, enum.Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class SystemHealthCheck(Base):
    __tablename__ = "system_health_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    check_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    component: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    message: Mapped[str | None] = None
    details: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    duration_ms: Mapped[int | None] = None
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    metric_value: Mapped[float] = None
    unit: Mapped[str | None] = None
    tags: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)  # JSON
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class SystemAlert(Base):
    __tablename__ = "system_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = None  # critical, warning, info
    title: Mapped[str] = None
    message: Mapped[str] = None
    source: Mapped[str] = None
    is_resolved: bool = False
    resolved_at: Mapped[datetime | None] = None
    resolved_by: Mapped[int | None] = None
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )