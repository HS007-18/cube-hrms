from datetime import date

from pydantic import BaseModel


class Metric(BaseModel):
    key: str
    label: str
    value: float
    unit: str | None = None


class Summary(BaseModel):
    role: str
    date: date
    metrics: list[Metric]
