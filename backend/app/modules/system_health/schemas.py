from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SystemHealthCheckBase(BaseModel):
    check_type: str
    component: str
    status: str
    message: str | None = None
    details: dict | None = None
    duration_ms: int | None = None


class SystemHealthCheckOut(SystemHealthCheckBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checked_at: datetime


class SystemMetricBase(BaseModel):
    metric_name: str
    metric_value: float
    unit: str | None = None
    tags: dict | None = None


class SystemMetricOut(SystemMetricBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recorded_at: datetime


class SystemAlertBase(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    source: str | None = None


class SystemAlertCreate(SystemAlertBase):
    pass


class SystemAlertUpdate(BaseModel):
    is_resolved: bool | None = None
    resolved_by: int | None = None


class SystemAlertOut(SystemAlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_resolved: bool
    resolved_at: datetime | None = None
    resolved_by: int | None = None
    created_at: datetime


class SystemHealthSummary(BaseModel):
    overall_status: str
    checks: list[SystemHealthCheckOut]
    metrics: list[SystemMetricOut]
    alerts: list[SystemAlertOut]