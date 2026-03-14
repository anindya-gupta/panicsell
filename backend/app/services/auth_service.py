import secrets
from app.config import get_settings

_active_tokens: set[str] = set()


def create_token(username: str, password: str) -> str | None:
    settings = get_settings()
    if not settings.admin_password:
        return None
    if username != settings.admin_username or password != settings.admin_password:
        return None
    token = secrets.token_hex(32)
    _active_tokens.add(token)
    return token


def validate_token(token: str) -> bool:
    return token in _active_tokens


def revoke_token(token: str) -> None:
    _active_tokens.discard(token)
