from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.announcements import service
from app.modules.announcements.schemas import (
    AnnouncementCreate,
    AnnouncementList,
    AnnouncementOut,
    AnnouncementUpdate,
)

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=AnnouncementList)
async def list_announcements(
    is_active: bool | None = Query(None),
    audience: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_announcements(
        ctx.session, ctx.tenant_id, is_active, audience, limit, offset
    )


@router.post("", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    payload: AnnouncementCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.create_announcement(ctx.session, ctx.tenant_id, payload, ctx.user.id)


@router.get("/{announcement_id}", response_model=AnnouncementOut)
async def get_announcement(
    announcement_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_announcement(ctx.session, ctx.tenant_id, announcement_id)


@router.patch("/{announcement_id}", response_model=AnnouncementOut)
async def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_announcement(ctx.session, ctx.tenant_id, announcement_id, payload)


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    await service.delete_announcement(ctx.session, ctx.tenant_id, announcement_id)