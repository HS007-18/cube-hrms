"""Async database engine, sessions and Postgres row-level-security context.

Every request session sets two GUCs before any business query:

* ``app.current_tenant_id`` — the tenant whose rows may be read/written.
* ``app.is_platform_admin`` — when ``true``, the platform-bypass RLS policy
  applies (used only by super-admin endpoints and auth lookups).

Policies are ``OR``-ed, so tenant users see exactly one tenant and platform
users see everything. An unset/empty tenant GUC matches nothing.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from functools import lru_cache

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import get_settings

TENANT_GUC = "app.current_tenant_id"
PLATFORM_GUC = "app.is_platform_admin"


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine() -> AsyncEngine:
    return create_async_engine(
        get_settings().database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False, autoflush=False)


async def _set_context(
    session: AsyncSession, *, tenant_id: int | None, is_platform_admin: bool
) -> None:
    await session.execute(
        text("SELECT set_config(:key, :value, false)"),
        {"key": TENANT_GUC, "value": "" if tenant_id is None else str(tenant_id)},
    )
    await session.execute(
        text("SELECT set_config(:key, :value, false)"),
        {"key": PLATFORM_GUC, "value": "true" if is_platform_admin else "false"},
    )


@event.listens_for(Session, "before_flush")
def _stamp_tenant_id(session: Session, flush_context, instances) -> None:
    """Fill ``tenant_id`` from the session's RLS context on new tenant rows.

    Services therefore never hardcode tenant ids, and a bug can never write a
    row into another tenant: the database policy rejects a mismatched stamp.
    """
    tenant_id = session.info.get("tenant_id")
    if tenant_id is None:
        return
    for obj in session.new:
        if hasattr(obj, "tenant_id") and getattr(obj, "tenant_id", None) is None:
            obj.tenant_id = tenant_id


@asynccontextmanager
async def session_scope(
    *, tenant_id: int | None = None, is_platform_admin: bool = False
) -> AsyncIterator[AsyncSession]:
    """Open a session with an explicit RLS context; commit on success."""
    session = get_sessionmaker()()
    try:
        await _set_context(session, tenant_id=tenant_id, is_platform_admin=is_platform_admin)
        session.sync_session.info["tenant_id"] = tenant_id
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
