from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    category: str
    name: str
    expiry_date: date | None = None


class DocumentCreate(DocumentBase):
    employee_id: int
    file_path: str
    file_size: int
    mime_type: str
    original_filename: str


class DocumentUpdate(BaseModel):
    category: str | None = None
    name: str | None = None
    status: str | None = None
    expiry_date: date | None = None


class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    employee_id: int
    file_path: str
    file_size: int
    mime_type: str
    original_filename: str
    status: str
    verified_by: int | None = None
    verified_at: datetime | None = None
    rejection_reason: str | None = None
    uploaded_by: int
    created_at: datetime
    updated_at: datetime
