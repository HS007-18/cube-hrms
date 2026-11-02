from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.core.config import get_settings
from app.core.deps import ACCESS_TOKEN_COOKIE, AuthContext, get_auth_context
from app.core.errors import unauthorized
from app.core.rate_limit import get_redis_client, RateLimiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
)
from app.modules.auth import service
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResult,
    RefreshRequest,
    UserProfile,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_settings = get_settings()
COOKIE_SECURE = _settings.environment != "development"

COOKIE_SETTINGS = {
    "httponly": True,
    "secure": COOKIE_SECURE,
    "samesite": "lax",
    "path": "/",
    "max_age": 60 * 30,  # 30 minutes, matches access token TTL
}


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(ACCESS_TOKEN_COOKIE, access_token, **COOKIE_SETTINGS)
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 14,  # 14 days, matches refresh token TTL
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie("refresh_token", path="/")


def _rate_limiter(request: Request) -> RateLimiter:
    return RateLimiter(get_redis_client())


@router.post("/login", response_model=LoginResult)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    limiter: RateLimiter = Depends(_rate_limiter),
) -> LoginResult:
    # Enforce rate limit on the login identifier (email) before any work.
    await limiter.check(str(payload.email).strip().lower())
    try:
        user = await service.authenticate(str(payload.email), payload.password)
    except HTTPException:
        raise
    except Exception:
        await limiter.record(str(payload.email).strip().lower())
        raise unauthorized("Incorrect email or password")
    access_token, refresh_token = await service.issue_tokens(user)
    profile = await service.get_profile(user)
    _set_auth_cookies(response, access_token, refresh_token)
    return LoginResult(
        access_token=access_token,
        refresh_token=refresh_token,
        user=profile,
    )


@router.post("/refresh", response_model=LoginResult)
async def refresh(
    payload: RefreshRequest,
    request: Request,
    response: Response,
) -> LoginResult:
    # Prefer the body-supplied token; fall back to the HttpOnly cookie.
    refresh_token = payload.refresh_token or request.cookies.get("refresh_token")
    user, access_token, refresh_token = await service.rotate_refresh_token(
        refresh_token
    )
    profile = await service.get_profile(user)
    _set_auth_cookies(response, access_token, refresh_token)
    return LoginResult(
        access_token=access_token,
        refresh_token=refresh_token,
        user=profile,
    )


@router.get("/me", response_model=UserProfile)
async def me(ctx: AuthContext = Depends(get_auth_context)) -> UserProfile:
    return await service.get_profile(ctx.user)


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    ctx: AuthContext = Depends(get_auth_context),
) -> None:
    """Revoke every active refresh token for the current user."""
    await service.revoke_all_tokens(ctx.user.id)
    _clear_auth_cookies(response)
