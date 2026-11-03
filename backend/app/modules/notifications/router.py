from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthContext, require_tenant_user
from app.modules.notifications import service
from app.modules.notifications.schemas import (
    NotificationList,
    NotificationOut,
    NotificationPreferences,
    NotificationUpdate,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
async def list_notifications(
    is_read: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_notifications(ctx.session, ctx.user_id, is_read, limit, offset)


@router.patch("/{notification_id}", response_model=NotificationOut)
async def mark_as_read(
    notification_id: int,
    payload: NotificationUpdate,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.mark_as_read(ctx.session, ctx.user_id, notification_id)


@router.post("/mark-all-read")
async def mark_all_read(ctx: AuthContext = Depends(require_tenant_user)):
    count = await service.mark_all_read(ctx.session, ctx.user_id)
    return {"marked": count}


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(ctx: AuthContext = Depends(require_tenant_user)):
    return await service.get_preferences(ctx.session, ctx.user_id)