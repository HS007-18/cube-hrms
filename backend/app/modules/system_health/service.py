# System Health service
import asyncio
import shutil
import time
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_engine
from app.core.errors import not_found
from app.core.rate_limit import get_redis_client
from app.modules.system_health.models import (
    HealthCheckType,
    HealthStatus,
    SystemAlert,
    SystemHealthCheck,
    SystemMetric,
)
from app.modules.system_health.schemas import (
    SystemAlertCreate,
    SystemAlertUpdate,
)

# A health probe must fail fast: an unreachable dependency degrades to an
# "unhealthy" result instead of hanging the request.
PROBE_TIMEOUT_SECONDS = 3.0


async def get_latest_checks(session: AsyncSession) -> list[SystemHealthCheck]:
    """Latest recorded result per check type."""
    stmt = (
        select(SystemHealthCheck)
        .distinct(SystemHealthCheck.check_type)
        .order_by(SystemHealthCheck.check_type, SystemHealthCheck.checked_at.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_latest_metrics(session: AsyncSession) -> list[SystemMetric]:
    """Latest recorded value per metric name."""
    stmt = (
        select(SystemMetric)
        .distinct(SystemMetric.metric_name)
        .order_by(SystemMetric.metric_name, SystemMetric.recorded_at.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def list_health_checks(
    session: AsyncSession,
    check_type: str | None = None,
    component: str | None = None,
    status_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[SystemHealthCheck]:
    stmt = select(SystemHealthCheck)
    if check_type:
        stmt = stmt.where(SystemHealthCheck.check_type == check_type)
    if component:
        stmt = stmt.where(SystemHealthCheck.component == component)
    if status_filter:
        stmt = stmt.where(SystemHealthCheck.status == status_filter)
    stmt = stmt.order_by(SystemHealthCheck.checked_at.desc()).limit(limit).offset(offset)
    return list((await session.execute(stmt)).scalars().all())


async def list_metrics(
    session: AsyncSession,
    metric_name: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[SystemMetric]:
    stmt = select(SystemMetric)
    if metric_name:
        stmt = stmt.where(SystemMetric.metric_name == metric_name)
    stmt = stmt.order_by(SystemMetric.recorded_at.desc()).limit(limit).offset(offset)
    return list((await session.execute(stmt)).scalars().all())


async def list_alerts(
    session: AsyncSession,
    is_resolved: bool | None = None,
    severity: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[SystemAlert]:
    stmt = select(SystemAlert)
    if is_resolved is not None:
        stmt = stmt.where(SystemAlert.is_resolved.is_(is_resolved))
    if severity:
        stmt = stmt.where(SystemAlert.severity == severity)
    stmt = stmt.order_by(SystemAlert.created_at.desc()).limit(limit).offset(offset)
    return list((await session.execute(stmt)).scalars().all())


async def get_alert(session: AsyncSession, alert_id: int) -> SystemAlert:
    stmt = select(SystemAlert).where(SystemAlert.id == alert_id)
    alert = (await session.execute(stmt)).scalar_one_or_none()
    if alert is None:
        raise not_found("Alert")
    return alert


async def create_alert(
    session: AsyncSession, payload: SystemAlertCreate
) -> SystemAlert:
    alert = SystemAlert(**payload.model_dump())
    session.add(alert)
    await session.flush()
    await session.refresh(alert)
    return alert


async def update_alert(
    session: AsyncSession, alert_id: int, payload: SystemAlertUpdate
) -> SystemAlert:
    alert = await get_alert(session, alert_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(alert, key, value)
    if "is_resolved" in data:
        if data["is_resolved"]:
            if alert.resolved_at is None:
                alert.resolved_at = datetime.now(UTC)
        else:
            # Re-opening: drop the stale resolution stamp so the alert does
            # not reappear as resolved with a timestamp from its last close.
            alert.resolved_at = None
            if "resolved_by" not in data:
                alert.resolved_by = None
    await session.flush()
    await session.refresh(alert)
    return alert


async def get_health_summary(session: AsyncSession) -> dict:
    checks = await get_latest_checks(session)
    metrics = await get_latest_metrics(session)
    alerts = await list_alerts(session, is_resolved=False, limit=10)

    if not checks:
        overall = HealthStatus.UNKNOWN.value
    elif any(check.status == HealthStatus.UNHEALTHY.value for check in checks):
        overall = HealthStatus.UNHEALTHY.value
    elif any(check.status == HealthStatus.DEGRADED.value for check in checks):
        overall = HealthStatus.DEGRADED.value
    else:
        overall = HealthStatus.HEALTHY.value

    return {
        "overall_status": overall,
        "checks": checks,
        "metrics": metrics,
        "alerts": alerts,
    }


@dataclass(frozen=True)
class ProbeOutcome:
    """Raw result of one probe, before it becomes a persisted check row."""

    status: HealthStatus
    message: str
    started: float
    details: dict | None = None


def _build_check(
    check_type: HealthCheckType, component: str, outcome: ProbeOutcome
) -> SystemHealthCheck:
    return SystemHealthCheck(
        check_type=check_type.value,
        component=component,
        status=outcome.status.value,
        message=outcome.message,
        details=outcome.details,
        duration_ms=round((time.perf_counter() - outcome.started) * 1000),
    )


async def _check_database() -> ProbeOutcome:
    """Ping Postgres on a dedicated connection so a failure stays reportable."""
    started = time.perf_counter()
    try:
        async with asyncio.timeout(PROBE_TIMEOUT_SECONDS):
            async with get_engine().connect() as conn:
                await conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - probe must capture any failure
        return ProbeOutcome(
            HealthStatus.UNHEALTHY,
            f"Database unreachable: {exc.__class__.__name__}",
            started,
        )
    return ProbeOutcome(HealthStatus.HEALTHY, "Database reachable", started)


async def _check_redis() -> ProbeOutcome:
    started = time.perf_counter()
    client = get_redis_client()
    try:
        async with asyncio.timeout(PROBE_TIMEOUT_SECONDS):
            await client.ping()
    except Exception as exc:  # noqa: BLE001 - probe must capture any failure
        return ProbeOutcome(
            HealthStatus.UNHEALTHY,
            f"Redis unreachable: {exc.__class__.__name__}",
            started,
        )
    finally:
        await client.aclose()
    return ProbeOutcome(HealthStatus.HEALTHY, "Redis reachable", started)


async def _check_disk_space() -> ProbeOutcome:
    started = time.perf_counter()
    try:
        usage = shutil.disk_usage("/")
    except OSError as exc:
        return ProbeOutcome(
            HealthStatus.UNKNOWN,
            f"Disk usage unavailable: {exc.__class__.__name__}",
            started,
        )
    used_percent = round(usage.used / usage.total * 100, 1)
    details = {
        "total_gb": round(usage.total / 1024**3, 1),
        "used_gb": round(usage.used / 1024**3, 1),
        "free_gb": round(usage.free / 1024**3, 1),
        "used_percent": used_percent,
    }
    if used_percent >= 95:
        status, message = HealthStatus.UNHEALTHY, "Disk nearly full"
    elif used_percent >= 85:
        status, message = HealthStatus.DEGRADED, "Disk running low on space"
    else:
        status, message = HealthStatus.HEALTHY, "Disk space OK"
    return ProbeOutcome(status, message, started, details)


async def run_all_health_checks(session: AsyncSession) -> list[SystemHealthCheck]:
    results = [
        _build_check(HealthCheckType.DATABASE, "postgres", await _check_database()),
        _build_check(HealthCheckType.REDIS, "redis", await _check_redis()),
        _build_check(
            HealthCheckType.DISK_SPACE, "root-filesystem", await _check_disk_space()
        ),
    ]
    for check in results:
        session.add(check)
    await session.flush()
    for check in results:
        await session.refresh(check)
    return results
