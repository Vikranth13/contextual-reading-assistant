from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


BACKEND_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)


class Settings(BaseSettings):
    gemini_api_key: SecretStr | None = None

    gemini_model: str = (
        "gemini-3.5-flash-lite"
    )

    model_config = SettingsConfigDict(
        env_file=str(
            BACKEND_DIR / ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()