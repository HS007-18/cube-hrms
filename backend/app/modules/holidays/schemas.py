from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class HolidayBase(BaseModel):
    name: str
    date: date
    type: str = "public"
    description: Optional[str] = None
    is_recurring: bool = False
    applies_to_all: bool = True


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    type: Optional[str] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None
    applies_to_all: Optional[bool] = None


class HolidayOut(HolidayBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    created_at: str
    updated_at: str