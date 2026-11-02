from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.leave import service
from app.modules.leave.schemas import (
    LeaveBalanceOut,
    LeaveRequestCreate,
    LeaveRequestOut,
    LeaveTypeCreate,
    LeaveTypeOut,
    LeaveTypeUpdate,
    ReviewRequest,
)

router = APIRouter(prefix="/leave", tags=["leave"])


@router.get("/types", response_model=list[LeaveTypeOut])
async def list_leave_types(
    include_inactive: bool = False,
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[LeaveTypeOut]:
    return await service.list_leave_types(ctx.session, include_inactive=include_inactive)


@router.post("/types", response_model=LeaveTypeOut, status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    payload: LeaveTypeCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> LeaveTypeOut:
    return await service.create_leave_type(ctx.session, payload)


@router.patch("/types/{leave_type_id}", response_model=LeaveTypeOut)
async def update_leave_type(
    leave_type_id: int,
    payload: LeaveTypeUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> LeaveTypeOut:
    return await service.update_leave_type(ctx.session, leave_type_id, payload)


@router.get("/balances", response_model=list[LeaveBalanceOut])
async def my_balances(
    year: int | None = Query(default=None, ge=2000, le=2100),
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[LeaveBalanceOut]:
    return await service.list_balances(ctx.session, user_id=ctx.user.id, year=year)


@router.post("/requests", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    payload: LeaveRequestCreate,
    ctx: AuthContext = Depends(require_tenant_user),
) -> LeaveRequestOut:
    return await service.apply_leave(
        ctx.session, user_id=ctx.user.id, payload=payload, actor=ctx.user
    )


@router.get("/requests", response_model=list[LeaveRequestOut])
async def list_requests(
    scope: str = Query(default="mine", pattern=r"^(mine|team|all)$"),
    status_filter: str | None = Query(
        default=None, alias="status", pattern=r"^(pending|approved|denied|cancelled)$"
    ),
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[LeaveRequestOut]:
    return await service.list_requests(
        ctx.session,
        role=ctx.user.role,
        user_id=ctx.user.id,
        scope=scope,
        status_filter=status_filter,
    )


@router.post("/requests/{request_id}/approve", response_model=LeaveRequestOut)
async def approve_request(
    request_id: int,
    payload: ReviewRequest | None = None,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
) -> LeaveRequestOut:
    return await service.approve_request(
        ctx.session,
        request_id=request_id,
        comment=payload.comment if payload else None,
        role=ctx.user.role,
        user_id=ctx.user.id,
        actor=ctx.user,
    )


@router.post("/requests/{request_id}/deny", response_model=LeaveRequestOut)
async def deny_request(
    request_id: int,
    payload: ReviewRequest,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
) -> LeaveRequestOut:
    return await service.deny_request(
        ctx.session,
        request_id=request_id,
        comment=payload.comment,
        role=ctx.user.role,
        user_id=ctx.user.id,
        actor=ctx.user,
    )


@router.post("/requests/{request_id}/cancel", response_model=LeaveRequestOut)
async def cancel_request(
    request_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
) -> LeaveRequestOut:
    return await service.cancel_request(
        ctx.session, request_id=request_id, user_id=ctx.user.id, actor=ctx.user
    )
