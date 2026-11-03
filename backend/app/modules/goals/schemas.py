from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "individual"
    start_date: date
    end_date: date
    target_value: Optional[Decimal] = None
    unit: Optional[str] = None
    weight: int = 100
    parent_goal_id: Optional[int] = None
    reviewer_id: Optional[int] = None


class GoalCreate(GoalBase):
    employee_id: Optional[int] = None
    team_id: Optional[int] = None
    owner_id: int


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_value: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    unit: Optional[str] = None
    weight: Optional[int] = None
    status: Optional[str] = None
    reviewer_id: Optional[int] = None


class GoalOut(GoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    employee_id: Optional[int] = None
    team_id: Optional[int] = None
    current_value: Optional[Decimal] = None
    weight: int
    parent_goal_id: Optional[int] = None
    owner_id: int
    reviewer_id: Optional[int] = None
    status: str
    created_at: str
    updated_at: str


class GoalReviewBase(BaseModel):
    period_start: date
    period_end: date
    rating: Optional[int] = None
    achievements: Optional[str] = None
    improvements: Optional[str] = None
    reviewer_comments: Optional[str] = None
    employee_self_assessment: Optional[str] = None


class GoalReviewCreate(GoalReviewBase):
    goal_id: int
    reviewer_id: int


class GoalReviewUpdate(BaseModel):
    rating: Optional[int] = None
    achievements: Optional[str] = None
    improvements: Optional[str] = None
    reviewer_comments: Optional[str] = None
    employee_self_assessment: Optional[str] = None
    status: Optional[str] = None


class GoalReviewOut(GoalReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    goal_id: int
    reviewer_id: int
    status: str
    reviewed_at: Optional[str] = None
    created_at: str
    updated_at: str


class GoalDetail(GoalOut):
    reviews: List[GoalReviewOut] = []