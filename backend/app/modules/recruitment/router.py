from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.recruitment import service
from app.modules.recruitment.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    RecruitmentCreate,
    RecruitmentDetail,
    RecruitmentOut,
    RecruitmentUpdate,
)

router = APIRouter(prefix="/recruitment", tags=["recruitment"])


@router.get("", response_model=list[RecruitmentOut])
async def list_recruitments(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    items = await service.list_recruitments(
        ctx.session, ctx.tenant_id, status_filter, limit, offset
    )
    return items


@router.post("", response_model=RecruitmentOut, status_code=status.HTTP_201_CREATED)
async def create_recruitment(
    payload: RecruitmentCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.create_recruitment(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{recruitment_id}", response_model=RecruitmentDetail)
async def get_recruitment(
    recruitment_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_recruitment(ctx.session, ctx.tenant_id, recruitment_id)


@router.patch("/{recruitment_id}", response_model=RecruitmentOut)
async def update_recruitment(
    recruitment_id: int,
    payload: RecruitmentUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_recruitment(ctx.session, ctx.tenant_id, recruitment_id, payload)


@router.post(
    "/{recruitment_id}/apply", response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_recruitment(
    recruitment_id: int,
    payload: ApplicationCreate,
):
    return await service.apply_to_recruitment(recruitment_id, payload)


@router.get("/{recruitment_id}/applications", response_model=list[ApplicationOut])
async def list_applications(
    recruitment_id: int,
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.list_applications(recruitment_id, status_filter, limit, offset)


@router.patch("/applications/{application_id}", response_model=ApplicationOut)
async def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_application(ctx.session, application_id, payload, ctx.user.id)