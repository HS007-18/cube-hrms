from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict

from pydantic import BaseModel, ConfigDict


class ReportBase(BaseModel):
    name: str
    type: str
    format: str = "csv"
    parameters: Optional[Dict] = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    status: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None


class ReportOut(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    generated_by: int
    generated_at: Optional[str] = None
    expires_at: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


class ReportList(BaseModel):
    items: List["ReportOut"]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)


class ReportScheduleBase(BaseModel):
    name: str
    type: str
    format: str = "csv"
    parameters: Optional[Dict] = None
    cron_expression: str
    recipients: Optional[List[str]] = None


class ReportScheduleCreate(ReportScheduleBase):
    pass


class ReportScheduleUpdate(BaseModel):
    is_active: Optional[bool] = None
    cron_expression: Optional[str] = None
    recipients: Optional[List[str]] = None


class ReportScheduleOut(ReportScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    is_active: bool
    last_run_at: Optional[str] = None
    next_run_at: Optional[str] = None
    created_by: int
    created_at: str
    updated_at: str