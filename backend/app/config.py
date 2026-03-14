from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    kite_api_key: str = ""
    kite_api_secret: str = ""

    groww_api_key: str = ""
    groww_api_secret: str = ""
    groww_totp_token: str = ""
    groww_totp_secret: str = ""
    groww_redirect_url: str = "http://localhost:8000/api/auth/callback/groww"

    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    smtp_email: str = ""
    smtp_app_password: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
