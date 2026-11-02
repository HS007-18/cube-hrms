"""Authentication context dependency and role guards.

The auth context resolves a JWT to a live user, then opens a tenant-scoped
session so every downstream query is filtered by Postgres RLS. Platform
sessions resolve *before* the tenant context, so login does not need one.

Tokens may be supplied either via the ``Authorization: Bearer`` header or
via an HttpOnly ``access_token`` cookie (set on login/refresh).
"""

from collections.abc import AsyncIterator
from dataclasses import dataclass

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import session_scope
from app.core.errors import forbidden, unauthorized
from app.core.security import decode_token
from app.modules.auth.models import User

_bearer = HTTPBearer(auto_error=False)

ACCESS_TOKEN_COOKIE = "access_token"


@dataclass
class AuthContext:
    user: User
    session: AsyncSession
    tenant_id: int | None
    is_platform_admin: bool


async def _load_user(user_id: int) -> User | None:
    async with session_scope(is_platform_admin=True) as session:
        return await session.get(User, user_id)


def _extract_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    """Resolve the access token from the Bearer header or HttpOnly cookie."""
    if credentials is not None:
        return credentials.credentials
    cookie = request.cookies.get(ACCESS_TOKEN_COOKIE)
    if cookie:
        return cookie
    return None


async def get_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AsyncIterator[AuthContext]:
    token = _extract_token(request, credentials)
    if token is None:
        raise unauthorized()
    try:
        payload = decode_token(token, "access")
        user_id = int(payload["sub"])
    except (ValueError, KeyError, TypeError):
        raise unauthorized("Invalid or expired token") from None

    user = await _load_user(user_id)
    if user is None or not user.is_active:
        raise unauthorized("This account is not active")
    if payload.get("tenant_id") != user.tenant_id:
        raise unauthorized("Session is no longer valid")

    async with session_scope(
        tenant_id=user.tenant_id, is_platform_admin=user.is_platform_admin
    ) as session:
        yield AuthContext(
            user=user,
            session=session,
            tenant_id=user.tenant_id,
            is_platform_admin=user.is_platform_admin,
        )


def require_roles(*roles: str):
    """Allow only the listed tenant roles (platform admins use their own APIs)."""

    async def _dependency(ctx: AuthContext = Depends(get_auth_context)) -> AuthContext:
        # Tenant endpoints are restricted to listed tenant roles; platform admins use their own APIs.
        if ctx.is_platform_admin or ctx.user.role not in roles:
            raise forbidden()
        return ctx

    return _dependency


async def require_tenant_user(ctx: AuthContext = Depends(get_auth_context)) -> AuthContext:
    if ctx.tenant_id is None:
        raise forbidden("This endpoint is available to tenant users only")
    return ctx


async def require_platform_admin(ctx: AuthContext = Depends(get_auth_context)) -> AuthContext:
    if not ctx.is_platform_admin:
        raise forbidden("Platform administrator access required")
    return ctx
