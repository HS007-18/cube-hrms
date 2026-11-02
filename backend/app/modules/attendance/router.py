from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.attendance import service
from app.modules.attendance.schemas import (
    AttendanceOut,
    ClockRequest,
    ClockResult,
    ManualAttendanceUpdate,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/clock-in", response_model=ClockResult)
async def clock_in(
    ctx: AuthContext = Depends(require_tenant_user),
) -> ClockResult:
    return await service.clock_in(ctx.session, user_id=ctx.user.id, actor=ctx.user)


@router.post("/clock-out", response_model=ClockResult)
async def clock_out(
    ctx: AuthContext = Depends(require_tenant_user),
) -> ClockResult:
    return await service.clock_out(ctx.session, user_id=ctx.user.id, actor=ctx.user)


@router.get("/me", response_model=list[AttendanceOut])
async def my_attendance(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[AttendanceOut]:
    return await service.list_my_attendance(ctx.session, user_id=ctx.user.id, month=month)


@router.get("", response_model=list[AttendanceOut])
async def list_attendance(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    employee_id: int | None = None,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
) -> list[AttendanceOut]:
    return await service.list_attendance(
        ctx.session,
        role=ctx.user.role,
        user_id=ctx.user.id,
        month=month,
        employee_id=employee_id,
    )


@router.patch("/{record_id}", response_model=AttendanceOut)
async def correct_attendance(
    record_id: int,
    payload: ManualAttendanceUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> AttendanceOut:
    return await service.correct_record(
        ctx.session, record_id=record_id, payload=payload, actor=ctx.user
    )
