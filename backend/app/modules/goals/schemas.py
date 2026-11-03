from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class GoalBase(BaseModel):
    title: str
    description: str | None = None
    type: str = "individual"
    start_date: date
    end_date: date
    target_value: Decimal | None = None
    unit: str | None = None
    weight: int = 100
    parent_goal_id: int | None = None
    reviewer_id: int | None = None


class GoalCreate(GoalBase):
    employee_id: int | None = None
    team_id: int | None = None
    owner_id: int


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    target_value: Decimal | None = None
    current_value: Decimal | None = None
    unit: str | None = None
    weight: int | None = None
    status: str | None = None
    reviewer_id: int | None = None


class GoalOut(GoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    employee_id: int | None = None
    team_id: int | None = None
    current_value: Decimal | None = None
    weight: int
    parent_goal_id: int | None = None
    owner_id: int
    reviewer_id: int | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class GoalReviewBase(BaseModel):
    period_start: date
    period_end: date
    rating: int | None = None
    achievements: str | None = None
    improvements: str | None = None
    reviewer_comments: str | None = None
    employee_self_assessment: str | None = None


class GoalReviewCreate(GoalReviewBase):
    goal_id: int
    reviewer_id: int


class GoalReviewUpdate(BaseModel):
    rating: int | None = None
    achievements: str | None = None
    improvements: str | None = None
    reviewer_comments: str | None = None
    employee_self_assessment: str | None = None
    status: str | None = None


class GoalReviewOut(GoalReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    goal_id: int
    reviewer_id: int
    status: str
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class GoalDetail(GoalOut):
    reviews: list[GoalReviewOut] = []