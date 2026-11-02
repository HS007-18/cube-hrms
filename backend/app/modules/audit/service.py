"""Audit trail writer used by privileged operations."""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog


async def record(
    session: AsyncSession,
    *,
    actor: Any,
    action: str,
    entity_type: str,
    entity_id: int | str | None = None,
    meta: dict[str, Any] | None = None,
    tenant_id: int | None = None,
) -> None:
    """Append an audit row. ``actor`` may be a User or None for system jobs."""
    session.add(
        AuditLog(
            tenant_id=tenant_id if tenant_id is not None else getattr(actor, "tenant_id", None),
            actor_user_id=getattr(actor, "id", None),
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            meta=meta,
        )
    )
