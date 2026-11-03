from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthContext, require_platform_admin
from app.modules.platform_audit import service
from app.modules.platform_audit.schemas import PlatformAuditLogList, PlatformAuditLogOut

router = APIRouter(prefix="/platform-audit", tags=["platform-audit"])


@router.get("", response_model=PlatformAuditLogList)
async def list_audit_logs(
    action: str | None = Query(None),
    tenant_id: int | None = Query(None),
    actor_user_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_audit_logs(
        ctx.session, action, tenant_id, actor_user_id, limit, offset
    )


@router.get("/{audit_id}", response_model=PlatformAuditLogOut)
async def get_audit_log(
    audit_id: int,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.get_audit_log(ctx.session, audit_id)