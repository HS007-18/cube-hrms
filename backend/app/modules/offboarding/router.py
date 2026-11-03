from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.offboarding import service
from app.modules.offboarding.schemas import (
    OffboardingCreate,
    OffboardingDetail,
    OffboardingOut,
    OffboardingTaskCreate,
    OffboardingTaskOut,
    OffboardingTaskUpdate,
    OffboardingUpdate,
)

router = APIRouter(prefix="/offboarding", tags=["offboarding"])


@router.get("", response_model=list[OffboardingOut])
async def list_offboardings(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    items = await service.list_offboardings(
        ctx.session, ctx.tenant_id, status_filter, limit, offset
    )
    return items


@router.post("", response_model=OffboardingDetail, status_code=status.HTTP_201_CREATED)
async def create_offboarding(
    payload: OffboardingCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.create_offboarding(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{offboarding_id}", response_model=OffboardingDetail)
async def get_offboarding(
    offboarding_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_offboarding(ctx.session, ctx.tenant_id, offboarding_id)


@router.patch("/{offboarding_id}", response_model=OffboardingOut)
async def update_offboarding(
    offboarding_id: int,
    payload: OffboardingUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_offboarding(ctx.session, ctx.tenant_id, offboarding_id, payload)


@router.post(
    "/{offboarding_id}/tasks", response_model=OffboardingTaskOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_task(
    offboarding_id: int,
    payload: OffboardingTaskCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.add_task(ctx.session, ctx.tenant_id, offboarding_id, payload)


@router.patch("/tasks/{task_id}", response_model=OffboardingTaskOut)
async def update_task(
    task_id: int,
    payload: OffboardingTaskUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "employee")),
):
    return await service.update_task(ctx.session, ctx.tenant_id, task_id, payload, ctx.user.id)


@router.post("/resign", response_model=OffboardingDetail, status_code=status.HTTP_201_CREATED)
async def initiate_resignation(
    payload: OffboardingCreate,
    ctx: AuthContext = Depends(require_tenant_user),
):
    # Employee initiates their own resignation
    return await service.create_offboarding(
        ctx.session, ctx.tenant_id, payload, ctx.user.id, is_resignation=True
    )