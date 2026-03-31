from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Channel Commerce Platform", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")
    secret_key: str = Field(alias="SECRET_KEY")
    app_admin_password: str = Field(default="admin123456", alias="APP_ADMIN_PASSWORD")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    erp_timeout: float = Field(default=10.0, alias="ERP_TIMEOUT")
    worker_poll_seconds: int = Field(default=30, alias="WORKER_POLL_SECONDS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
