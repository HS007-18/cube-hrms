from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthContext, require_platform_admin
from app.modules.system_health import service
from app.modules.system_health.schemas import (
    SystemAlertCreate,
    SystemAlertOut,
    SystemAlertUpdate,
    SystemHealthCheckOut,
    SystemHealthSummary,
    SystemMetricOut,
)

router = APIRouter(prefix="/system-health", tags=["system-health"])


@router.get("/summary", response_model=SystemHealthSummary)
async def get_health_summary(ctx: AuthContext = Depends(require_platform_admin)):
    return await service.get_health_summary(ctx.session)


@router.get("/checks", response_model=list[SystemHealthCheckOut])
async def list_health_checks(
    check_type: str | None = Query(None),
    component: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_health_checks(ctx.session, check_type, component, status_filter, limit, offset)


@router.get("/metrics", response_model=list[SystemMetricOut])
async def list_metrics(
    metric_name: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_metrics(ctx.session, metric_name, limit, offset)


@router.get("/alerts", response_model=list[SystemAlertOut])
async def list_alerts(
    is_resolved: bool | None = Query(None),
    severity: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_alerts(ctx.session, is_resolved, severity, limit, offset)


@router.post("/alerts", response_model=SystemAlertOut, status_code=201)
async def create_alert(
    payload: SystemAlertCreate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.create_alert(ctx.session, payload)


@router.patch("/alerts/{alert_id}", response_model=SystemAlertOut)
async def update_alert(
    alert_id: int,
    payload: SystemAlertUpdate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.update_alert(ctx.session, alert_id, payload)


@router.post("/checks/run", response_model=list[SystemHealthCheckOut])
async def run_health_checks(ctx: AuthContext = Depends(require_platform_admin)):
    return await service.run_all_health_checks(ctx.session)