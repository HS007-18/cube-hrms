from datetime import date, datetime
from datetime import date as date_type  # noqa: I001 - alias for HolidayUpdate.date

from pydantic import BaseModel, ConfigDict


class HolidayBase(BaseModel):
    name: str
    date: date
    type: str = "public"
    description: str | None = None
    is_recurring: bool = False
    applies_to_all: bool = True


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    name: str | None = None
    # Annotated through an alias: the field is named ``date`` too, and the
    # class body stores the default before evaluating the annotation, which
    # would resolve ``date`` to None and break update validation.
    date: date_type | None = None
    type: str | None = None
    description: str | None = None
    is_recurring: bool | None = None
    applies_to_all: bool | None = None


class HolidayOut(HolidayBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime
