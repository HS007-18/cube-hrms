from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.goals import service
from app.modules.goals.schemas import (
    GoalCreate,
    GoalDetail,
    GoalOut,
    GoalReviewCreate,
    GoalReviewOut,
    GoalReviewUpdate,
    GoalUpdate,
)

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
async def list_goals(
    status_filter: str | None = Query(None, alias="status"),
    type_filter: str | None = Query(None, alias="type"),
    employee_id: int | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    items = await service.list_goals(
        ctx.session,
        ctx.tenant_id,
        ctx.user_id,
        ctx.user.role,
        status_filter,
        type_filter,
        employee_id,
        limit,
        offset,
    )
    return items


@router.post("", response_model=GoalDetail, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.create_goal(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{goal_id}", response_model=GoalDetail)
async def get_goal(
    goal_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_goal(ctx.session, ctx.tenant_id, goal_id, ctx.user_id, ctx.user.role)


@router.patch("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_goal(ctx.session, ctx.tenant_id, goal_id, payload, ctx.user.id)


@router.post("/{goal_id}/reviews", response_model=GoalReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    goal_id: int,
    payload: GoalReviewCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.create_review(ctx.session, ctx.tenant_id, goal_id, payload, ctx.user.id)


@router.patch("/reviews/{review_id}", response_model=GoalReviewOut)
async def update_review(
    review_id: int,
    payload: GoalReviewUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_review(ctx.session, ctx.tenant_id, review_id, payload, ctx.user.id)