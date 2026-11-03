# System Health service
from datetime import datetime
from typing import Optional, List, Dict

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.system_health.models import SystemHealthCheck, SystemMetric, SystemAlert
from app.modules.system_health.schemas import (
    SystemHealthCheckOut,
    SystemMetricOut,
    SystemAlertCreate,
    SystemAlertUpdate,
)


async def get_health_summary(session) -> dict:
    checks = await get_latest_checks(session)
    metrics = await get_latest_metrics(session)
    alerts = await list_alerts(session, is_resolved=False, limit=10)
    
    overall = "healthy"
    for check in checks:
        if check.status == "unhealthy":
            overall = "unhealthy"
            break
        elif check.status == "degraded":
            overall = "degraded"
    
    return {
        "overall_status": overall,
        "checks": checks,
        "metrics": metrics,
        "alerts": alerts,
    }


async def get_latest_checks(session) -> list[SystemHealthCheckOut]:
    stmt = select(SystemHealthCheck).order_by(
        SystemHealthCheck.component, SystemHealthCheck.checked_at.desc()
    )
    checks = (await session.execute(stmt)).scalars().all()
    
    latest = {}
    for check in checks:
        if check.component not in latest:
            latest[check.component] = check
    
    return list(latest.values())


async def get_latest_metrics(session) -> list[SystemMetricOut]:
    stmt = select(SystemMetric).order_by(
        SystemMetric.metric_name, SystemMetric.recorded_at.desc()
    )
    metrics = (await session.execute(stmt)).scalars().all()
    
    latest = {}
    for metric in metrics:
        if metric.metric_name not in latest:
            latest[metric.metric_name] = metric
    
    return list(latest.values())