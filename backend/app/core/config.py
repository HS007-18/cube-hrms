from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Secrets that are acceptable only while developing locally. Anything else
# aborts startup so a misconfigured production box never runs with weak keys.
INSECURE_SECRETS = {"dev-only-secret-change-me", "change-me", "secret"}

ENV_FILES = (str(Path(__file__).resolve().parents[3] / ".env"), ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILES, env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    app_name: str = "CUBE HRMS"
    app_version: str = "0.1.0"
    environment: str = "development"
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
        if self.environment != "development" and self.jwt_secret in INSECURE_SECRETS:
            raise RuntimeError(
                "JWT_SECRET must be set to a strong, unique value outside development"
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime()
    return settings
