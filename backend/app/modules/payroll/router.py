from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.payroll import service
from app.modules.payroll.schemas import (
    PayrollCreate,
    PayrollDetail,
    PayrollItemCreate,
    PayrollItemOut,
    PayrollOut,
    PayrollProcessRequest,
    PayrollUpdate,
)

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("", response_model=list[PayrollOut])
async def list_payrolls(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    items = await service.list_payrolls(ctx.session, ctx.tenant_id, limit, offset)
    return items


@router.post("", response_model=PayrollOut, status_code=status.HTTP_201_CREATED)
async def create_payroll(
    payload: PayrollCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.create_payroll(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{payroll_id}", response_model=PayrollDetail)
async def get_payroll(
    payroll_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_payroll(ctx.session, ctx.tenant_id, payroll_id)


@router.patch("/{payroll_id}", response_model=PayrollOut)
async def update_payroll(
    payroll_id: int,
    payload: PayrollUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_payroll(ctx.session, ctx.tenant_id, payroll_id, payload)


@router.post("/{payroll_id}/items", response_model=PayrollItemOut, status_code=status.HTTP_201_CREATED)
async def add_payroll_item(
    payroll_id: int,
    payload: PayrollItemCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.add_payroll_item(ctx.session, ctx.tenant_id, payroll_id, payload)


@router.post("/{payroll_id}/process", response_model=PayrollOut)
async def process_payroll(
    payroll_id: int,
    payload: PayrollProcessRequest,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.process_payroll(ctx.session, ctx.tenant_id, payroll_id, ctx.user.id)