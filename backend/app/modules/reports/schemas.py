from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportBase(BaseModel):
    name: str
    type: str
    format: str = "csv"
    parameters: dict | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    status: str | None = None
    file_path: str | None = None
    file_size: int | None = None
    error_message: str | None = None


class ReportOut(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    generated_by: int
    generated_at: datetime | None = None
    expires_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class ReportList(BaseModel):
    items: list["ReportOut"]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)


class ReportScheduleBase(BaseModel):
    name: str
    type: str
    format: str = "csv"
    parameters: dict | None = None
    cron_expression: str
    recipients: list[str] | None = None


class ReportScheduleCreate(ReportScheduleBase):
    pass


class ReportScheduleUpdate(BaseModel):
    is_active: bool | None = None
    cron_expression: str | None = None
    recipients: list[str] | None = None


class ReportScheduleOut(ReportScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    is_active: bool
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None
    created_by: int
    created_at: datetime
    updated_at: datetime
