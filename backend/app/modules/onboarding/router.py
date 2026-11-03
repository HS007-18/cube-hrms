from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.onboarding import service
from app.modules.onboarding.schemas import (
    OnboardingCreate,
    OnboardingDetail,
    OnboardingOut,
    OnboardingUpdate,
    OnboardingTaskCreate,
    OnboardingTaskOut,
    OnboardingTaskUpdate,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("", response_model=list[OnboardingOut])
async def list_onboardings(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    items = await service.list_onboardings(ctx.session, ctx.tenant_id, status_filter, limit, offset)
    return items


@router.post("", response_model=OnboardingDetail, status_code=status.HTTP_201_CREATED)
async def create_onboarding(
    payload: OnboardingCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.create_onboarding(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{onboarding_id}", response_model=OnboardingDetail)
async def get_onboarding(
    onboarding_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_onboarding(ctx.session, ctx.tenant_id, onboarding_id)


@router.patch("/{onboarding_id}", response_model=OnboardingOut)
async def update_onboarding(
    onboarding_id: int,
    payload: OnboardingUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_onboarding(ctx.session, ctx.tenant_id, onboarding_id, payload)


@router.post("/{onboarding_id}/tasks", response_model=OnboardingTaskOut, status_code=status.HTTP_201_CREATED)
async def add_task(
    onboarding_id: int,
    payload: OnboardingTaskCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.add_task(ctx.session, ctx.tenant_id, onboarding_id, payload)


@router.patch("/tasks/{task_id}", response_model=OnboardingTaskOut)
async def update_task(
    task_id: int,
    payload: OnboardingTaskUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "employee")),
):
    return await service.update_task(ctx.session, ctx.tenant_id, task_id, payload, ctx.user.id)