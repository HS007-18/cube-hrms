from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    category: str
    name: str
    expiry_date: Optional[date] = None


class DocumentCreate(DocumentBase):
    employee_id: int
    file_path: str
    file_size: int
    mime_type: str
    original_filename: str


class DocumentUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    expiry_date: Optional[date] = None


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
    verified_by: Optional[int] = None
    verified_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    uploaded_by: int
    created_at: str
    updated_at: str