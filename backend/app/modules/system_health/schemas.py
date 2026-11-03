from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel, ConfigDict


class SystemHealthCheckBase(BaseModel):
    check_type: str
    component: str
    status: str
    message: Optional[str] = None
    details: Optional[Dict] = None
    duration_ms: Optional[int] = None


class SystemHealthCheckOut(SystemHealthCheckBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checked_at: str


class SystemMetricBase(BaseModel):
    metric_name: str
    metric_value: float
    unit: Optional[str] = None
    tags: Optional[Dict] = None


class SystemMetricOut(SystemMetricBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recorded_at: str


class SystemAlertBase(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    source: Optional[str] = None


class SystemAlertCreate(SystemAlertBase):
    pass


class SystemAlertUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    resolved_by: Optional[int] = None


class SystemAlertOut(SystemAlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_resolved: bool
    resolved_at: Optional[str] = None
    resolved_by: Optional[int] = None
    created_at: str


class SystemHealthSummary(BaseModel):
    overall_status: str
    checks: List[SystemHealthCheckOut]
    metrics: List[SystemMetricOut]
    alerts: List[SystemAlertOut]