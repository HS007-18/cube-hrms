from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import func, select, update

from app.core.db import session_scope
from app.core.errors import forbidden, unauthorized
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    refresh_token_expiry,
    verify_password,
)
from app.modules.audit import service as audit
from app.modules.auth.models import RefreshToken, User
from app.modules.auth.schemas import UserProfile
from app.modules.employees.models import Employee
from app.modules.tenants.models import Tenant


async def authenticate(email: str, password: str) -> User:
    normalized = email.strip().lower()
    async with session_scope(is_platform_admin=True) as session:
        user = (
            await session.execute(select(User).where(func.lower(User.email) == normalized))
        ).scalar_one_or_none()
        if user is None or not verify_password(password, user.hashed_password):
            raise unauthorized("Incorrect email or password")
        if not user.is_active:
            raise forbidden("This account has been deactivated")
        await audit.record(
            session,
            actor=user,
            action="auth.login",
            entity_type="user",
            entity_id=user.id,
        )
        return user


async def get_active_user(user_id: int) -> User:
    async with session_scope(is_platform_admin=True) as session:
        user = await session.get(User, user_id)
        if user is None or not user.is_active:
            raise unauthorized("This account is not active")
        return user


async def issue_tokens(user: User) -> tuple[str, str]:
    """Persist a refresh-token record and return a fresh access/refresh pair."""
    jti = uuid4().hex
    async with session_scope(is_platform_admin=True) as session:
        session.add(
            RefreshToken(
                tenant_id=user.tenant_id,
                user_id=user.id,
                jti=jti,
                expires_at=refresh_token_expiry(),
            )
        )
    return create_access_token(user), create_refresh_token(user, jti)


async def rotate_refresh_token(token: str) -> tuple[User, str, str]:
    """One-time refresh rotation with reuse detection."""
    try:
        payload = decode_token(token, "refresh")
        jti = str(payload["jti"])
        user_id = int(payload["sub"])
    except (ValueError, KeyError, TypeError):
        raise unauthorized("Invalid or expired refresh token") from None

    now = datetime.now(UTC)
    async with session_scope(is_platform_admin=True) as session:
        record = (
            await session.execute(
                select(RefreshToken).where(RefreshToken.jti == jti).with_for_update()
            )
        ).scalar_one_or_none()
        if record is None or record.user_id != user_id:
            raise unauthorized("Invalid or expired refresh token")

        if record.revoked_at is not None:
            # A revoked token came back: assume theft and burn the whole family.
            await session.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.user_id == record.user_id,
                    RefreshToken.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )
            await audit.record(
                session,
                actor=None,
                action="auth.refresh_reuse_detected",
                entity_type="user",
                entity_id=record.user_id,
            )
            await session.commit()
            raise unauthorized("Refresh token has already been used")

        if record.expires_at <= now:
            raise unauthorized("Refresh token has expired")

        user = await session.get(User, record.user_id)
        if user is None or not user.is_active:
            raise forbidden("This account is not active")
        if user.tenant_id != record.tenant_id:
            raise unauthorized("Session is no longer valid")

        new_jti = uuid4().hex
        record.revoked_at = now
        record.replaced_by_jti = new_jti
        session.add(
            RefreshToken(
                tenant_id=user.tenant_id,
                user_id=user.id,
                jti=new_jti,
                expires_at=refresh_token_expiry(),
            )
        )
        await audit.record(
            session,
            actor=user,
            action="auth.refreshed",
            entity_type="user",
            entity_id=user.id,
        )
        return (
            user,
            create_access_token(user),
            create_refresh_token(user, new_jti),
        )


async def revoke_all_tokens(user_id: int) -> None:
    async with session_scope(is_platform_admin=True) as session:
        await session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await audit.record(
            session,
            actor=None,
            action="auth.logout",
            entity_type="user",
            entity_id=user_id,
        )


async def get_profile(user: User) -> UserProfile:
    tenant_name: str | None = None
    employee_id: int | None = None
    async with session_scope(is_platform_admin=True) as session:
        if user.tenant_id is not None:
            tenant = await session.get(Tenant, user.tenant_id)
            tenant_name = tenant.name if tenant else None
        employee = (
            await session.execute(select(Employee).where(Employee.user_id == user.id))
        ).scalar_one_or_none()
        if employee is not None:
            employee_id = employee.id
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        tenant_id=user.tenant_id,
        tenant_name=tenant_name,
        is_platform_admin=user.is_platform_admin,
        employee_id=employee_id,
    )
