# Goals service
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.goals.models import Goal, GoalReview
from app.modules.goals.schemas import (
    GoalCreate,
    GoalUpdate,
    GoalReviewCreate,
    GoalReviewUpdate,
)


async def list_goals(
    session,
    tenant_id: int,
    user_id: int,
    user_role: str,
    status_filter: str | None = None,
    type_filter: str | None = None,
    employee_id: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Goal]:
    stmt = select(Goal).where(Goal.tenant_id == tenant_id)
    
    # Role-based filtering
    if user_role == "employee":
        stmt = stmt.where(Goal.employee_id == user_id)
    elif user_role == "manager":
        # Manager can see their team's goals
        # This would need a proper team lookup - simplified for now
        pass
    
    if status_filter:
        stmt = stmt.where(Goal.status == status_filter)
    if type_filter:
        stmt = stmt.where(Goal.type == type_filter)
    if employee_id:
        stmt = stmt.where(Goal.employee_id == employee_id)
    
    stmt = stmt.order_by(Goal.created_at.desc()).limit(limit).offset(offset)
    return (await session.execute(stmt)).scalars().all()


async def get_goal(session, tenant_id: int, goal_id: int, user_id: int, user_role: str) -> Goal:
    stmt = select(Goal).where(
        Goal.id == goal_id,
        Goal.tenant_id == tenant_id,
    )
    goal = (await session.execute(stmt)).scalar_one_or_none()
    if goal is None:
        raise not_found("Goal")
    
    # Check permissions
    if user_role == "employee" and goal.employee_id != user_id:
        raise not_found("Goal")
    
    return goal


async def create_goal(session, tenant_id: int, payload, owner_id: int) -> Goal:
    goal = Goal(
        tenant_id=tenant_id,
        owner_id=owner_id,
        **payload.model_dump(),
    )
    session.add(goal)
    await session.flush()
    await session.refresh(goal)
    return goal


async def update_goal(
    session, tenant_id: int, goal_id: int, payload, user_id: int
) -> Goal:
    stmt = select(Goal).where(
        Goal.id == goal_id,
        Goal.tenant_id == tenant_id,
    )
    goal = (await session.execute(stmt)).scalar_one_or_none()
    if goal is None:
        raise not_found("Goal")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    goal.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(goal)
    return goal


async def create_review(
    session, tenant_id: int, goal_id: int, payload, reviewer_id: int
) -> GoalReview:
    stmt = select(Goal).where(Goal.id == goal_id, Goal.tenant_id == tenant_id)
    goal = (await session.execute(stmt)).scalar_one_or_none()
    if goal is None:
        raise not_found("Goal")
    
    review = GoalReview(
        tenant_id=tenant_id,
        goal_id=goal_id,
        reviewer_id=payload.reviewer_id,
        **payload.model_dump(exclude={"goal_id", "reviewer_id"}),
    )
    session.add(review)
    await session.flush()
    await session.refresh(review)
    return review


async def update_review(
    session, tenant_id: int, review_id: int, payload, user_id: int
) -> GoalReview:
    stmt = select(GoalReview).where(
        GoalReview.id == review_id,
        GoalReview.tenant_id == tenant_id,
    )
    review = (await session.execute(stmt)).scalar_one_or_none()
    if review is None:
        raise not_found("GoalReview")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    if payload.status == "completed":
        review.reviewed_at = datetime.utcnow()
    await session.flush()
    await session.refresh(review)
    return review