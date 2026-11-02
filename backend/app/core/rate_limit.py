"""Redis-backed fixed-window rate limiter for authentication endpoints.

Tracks failed login attempts per (identifier) key and rejects requests
once the configured threshold is exceeded within the window.
"""

from datetime import UTC, datetime, timedelta
from functools import lru_cache

import redis.asyncio as aioredis

from app.core.config import get_settings


class RateLimiter:
    """Fixed-window rate limiter backed by Redis."""

    def __init__(
        self,
        redis_client: aioredis.Redis,
        max_attempts: int | None = None,
        window_seconds: int | None = None,
    ):
        settings = get_settings()
        self._redis = redis_client
        self._max_attempts = max_attempts if max_attempts is not None else settings.rate_limit_max_attempts
        self._window = window_seconds if window_seconds is not None else settings.rate_limit_window_seconds

    async def check(self, key: str) -> None:
        """Raise if the key has exceeded its attempt budget."""
        now = datetime.now(UTC)
        window_start = now - timedelta(seconds=self._window)

        # Clean old entries and count current window attempts.
        pipe = self._redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start.timestamp())
        pipe.zcard(key)
        results = await pipe.execute()
        current_count = results[1]

        if current_count >= self._max_attempts:
            from app.core.errors import forbidden

            raise forbidden(
                "Too many login attempts. Please try again later."
            )

    async def record(self, key: str) -> None:
        """Record a failed attempt for the key."""
        now = datetime.now(UTC)
        await self._redis.zadd(key, {str(now.timestamp()): now.timestamp()})
        await self._redis.expire(key, self._window)


@lru_cache
def get_redis_client() -> aioredis.Redis:
    """Build an async Redis client with connection pool from settings."""
    settings = get_settings()
    return aioredis.from_url(settings.redis_url, decode_responses=True)