from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.holidays import service
from app.modules.holidays.schemas import HolidayCreate, HolidayOut, HolidayUpdate

router = APIRouter(prefix="/holidays", tags=["holidays"])


@router.get("", response_model=list[HolidayOut])
async def list_holidays(
    year: int | None = Query(None),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_holidays(ctx.session, ctx.tenant_id, year)


@router.post("", response_model=HolidayOut, status_code=status.HTTP_201_CREATED)
async def create_holiday(
    payload: HolidayCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.create_holiday(ctx.session, ctx.tenant_id, payload)


@router.patch("/{holiday_id}", response_model=HolidayOut)
async def update_holiday(
    holiday_id: int,
    payload: HolidayUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_holiday(ctx.session, ctx.tenant_id, holiday_id, payload)


@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holiday(
    holiday_id: int,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    await service.delete_holiday(ctx.session, ctx.tenant_id, holiday_id)