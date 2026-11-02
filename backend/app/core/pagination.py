"""Offset pagination primitives shared by list endpoints."""

from pydantic import BaseModel


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int
