from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_platform_admin
from app.core.pagination import Page
from app.modules.tenants import service
from app.modules.tenants.schemas import (
    CreateTenantResult,
    ProvisionResult,
    TenantCreate,
    TenantDetail,
    TenantOut,
    TenantStatusUpdate,
)

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("", response_model=Page[TenantOut])
async def list_tenants(
    q: str | None = Query(default=None, max_length=120),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    ctx: AuthContext = Depends(require_platform_admin),
) -> Page[TenantOut]:
    items, total = await service.list_tenants(
        ctx.session, status=status_filter, q=q, limit=limit, offset=offset
    )
    return Page[TenantOut](items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=CreateTenantResult, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate,
    ctx: AuthContext = Depends(require_platform_admin),
) -> CreateTenantResult:
    return await service.create_tenant(ctx.session, payload=payload, actor=ctx.user)


@router.get("/{tenant_id}", response_model=TenantDetail)
async def get_tenant(
    tenant_id: int, ctx: AuthContext = Depends(require_platform_admin)
) -> TenantDetail:
    return await service.tenant_detail(ctx.session, tenant_id)


@router.post("/{tenant_id}/provision", response_model=ProvisionResult)
async def provision_tenant(
    tenant_id: int, ctx: AuthContext = Depends(require_platform_admin)
) -> ProvisionResult:
    return await service.provision_tenant(ctx.session, tenant_id=tenant_id, actor=ctx.user)


@router.patch("/{tenant_id}/status", response_model=TenantOut)
async def update_tenant_status(
    tenant_id: int,
    payload: TenantStatusUpdate,
    ctx: AuthContext = Depends(require_platform_admin),
) -> TenantOut:
    return await service.set_status(
        ctx.session, tenant_id=tenant_id, status=payload.status.value, actor=ctx.user
    )
