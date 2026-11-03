import logging
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Secrets that are acceptable only while developing locally. Anything else
# aborts startup so a misconfigured production box never runs with weak keys.
INSECURE_SECRETS = {"dev-only-secret-change-me", "change-me", "secret"}

# Only these modes may run with weak secrets or non-Secure cookies.
DEVELOPMENT_MODES = {"development", "test"}
ALLOWED_ENVIRONMENTS = DEVELOPMENT_MODES | {"staging", "production"}
# HMAC-SHA2 only: "none" or asymmetric algorithms must never be selectable
# via environment, or every token becomes forgeable / downgradable.
ALLOWED_JWT_ALGORITHMS = {"HS256", "HS384", "HS512"}
MIN_PRODUCTION_SECRET_LENGTH = 32

ENV_FILES = (str(Path(__file__).resolve().parents[3] / ".env"), ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILES, env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    app_name: str = "CUBE HRMS"
    app_version: str = "0.1.0"
    # Required on purpose: a missing ENVIRONMENT must crash startup instead of
    # silently defaulting to development (which disables the guards below).
    environment: str
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://cube_app:cube_app_dev_password@127.0.0.1:5433/cube_hrms"
    # Owner connection used only for schema migrations; the API never uses it.
    migration_database_url: str | None = None
    redis_url: str = "redis://127.0.0.1:6380/0"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 14

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]

    rate_limit_max_attempts: int = 5
    rate_limit_window_seconds: int = 300

    minio_endpoint: str = "127.0.0.1:9010"
    minio_access_key: str = "cube"
    minio_secret_key: str = "cube_dev_secret"
    minio_bucket: str = "cube-files"
    openai_api_key: str = ""

    default_currency: str = "INR"
    default_timezone: str = "Asia/Kolkata"

    def validate_runtime(self) -> None:
        if self.environment not in ALLOWED_ENVIRONMENTS:
            raise RuntimeError(
                "ENVIRONMENT must be one of "
                f"{sorted(ALLOWED_ENVIRONMENTS)}, got {self.environment!r}"
            )
        if self.jwt_algorithm not in ALLOWED_JWT_ALGORITHMS:
            raise RuntimeError(
                "JWT_ALGORITHM must be one of "
                f"{sorted(ALLOWED_JWT_ALGORITHMS)}, got {self.jwt_algorithm!r}"
            )
        if self.environment in DEVELOPMENT_MODES:
            # Loud by design: a production box running in development mode
            # would serve non-Secure cookies and accept weak JWT secrets.
            logging.getLogger("cube.hrms").warning(
                "Running in %s mode: development-only behavior is active "
                "(weak-secret guard relaxed, non-Secure cookies, demo seed "
                "allowed). Set ENVIRONMENT=production for deployments.",
                self.environment,
            )
            return
        # Staging/production: refuse weak keys outright (length floor also
        # rejects the example secret even if INSECURE_SECRETS were bypassed).
        weak = self.jwt_secret in INSECURE_SECRETS
        if weak or len(self.jwt_secret) < MIN_PRODUCTION_SECRET_LENGTH:
            raise RuntimeError(
                "JWT_SECRET must be a strong, unique value of at least "
                f"{MIN_PRODUCTION_SECRET_LENGTH} characters outside development "
                "(generate one with: openssl rand -base64 48)"
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime()
    return settings
