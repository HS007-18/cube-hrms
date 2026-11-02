"""Password hashing (argon2) and JWT token helpers."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import get_settings

_hasher = PasswordHasher()


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


ACCESS_TOKEN = "access"
REFRESH_TOKEN = "refresh"


def _encode(payload: dict[str, Any]) -> str:
    settings = get_settings()
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _payload(user: Any, token_type: str, ttl: timedelta, jti: str) -> dict[str, Any]:
    now = datetime.now(UTC)
    return {
        "sub": str(user.id),
        "tenant_id": user.tenant_id,
        "role": user.role,
        "is_platform_admin": user.is_platform_admin,
        "type": token_type,
        "jti": jti,
        "iat": now,
        "exp": now + ttl,
    }


def create_access_token(user: Any) -> str:
    settings = get_settings()
    return _encode(
        _payload(
            user,
            ACCESS_TOKEN,
            timedelta(minutes=settings.access_token_ttl_minutes),
            uuid4().hex,
        )
    )


def create_refresh_token(user: Any, jti: str) -> str:
    settings = get_settings()
    return _encode(
        _payload(user, REFRESH_TOKEN, timedelta(days=settings.refresh_token_ttl_days), jti)
    )


def refresh_token_expiry() -> datetime:
    settings = get_settings()
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days)


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:  # expired, bad signature, malformed
        raise ValueError("invalid token") from exc
    if payload.get("type") != expected_type:
        raise ValueError("unexpected token type")
    return payload
