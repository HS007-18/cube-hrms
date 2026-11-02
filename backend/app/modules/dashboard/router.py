from fastapi import APIRouter, Depends

from app.core.deps import AuthContext, require_tenant_user
from app.modules.dashboard import service
from app.modules.dashboard.schemas import Summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=Summary)
async def summary(ctx: AuthContext = Depends(require_tenant_user)) -> Summary:
    return await service.summary(ctx.session, user=ctx.user)
