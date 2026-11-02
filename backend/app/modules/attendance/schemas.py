from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field

AttendanceStatusLiteral = Literal["present", "absent", "half_day", "holiday", "leave", "weekend"]


class ClockRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=500)


class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str | None = None
    work_date: date
    clock_in: time | None
    clock_out: time | None
    status: str
    work_minutes: int | None
    notes: str | None
    source: str


class ClockResult(BaseModel):
    record: AttendanceOut
    message: str


class ManualAttendanceUpdate(BaseModel):
    status: AttendanceStatusLiteral | None = None
    clock_in: time | None = None
    clock_out: time | None = None
    notes: str | None = Field(default=None, max_length=500)
