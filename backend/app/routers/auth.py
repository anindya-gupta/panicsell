from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from app.services.broker_manager import broker_manager
from app.services.auth_service import create_token, revoke_token
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class AppLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/app-login")
def app_login(req: AppLoginRequest):
    """Authenticate with admin username/password and receive a session token."""
    token = create_token(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": token}


@router.post("/app-logout")
def app_logout(request: Request):
    """Revoke the current app session token."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        revoke_token(auth_header[7:])
    return {"status": "logged_out"}


@router.get("/login/{broker_name}")
def login(broker_name: str):
    """Redirect user to the broker's login page, or connect directly for key-based brokers."""
    settings = get_settings()
    try:
        broker = broker_manager.get_broker(broker_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    login_url = broker.get_login_url()
    if not login_url:
        try:
            broker.generate_session()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to {broker.display_name}: {e}")
        return RedirectResponse(url=f"{settings.frontend_url}/dashboard?connected={broker_name}")

    logger.info(f"Redirecting to {broker.display_name} login. Callback should hit: {settings.backend_url}/api/auth/callback")
    return RedirectResponse(url=login_url)


@router.get("/callback/{broker_name}")
def callback(
    broker_name: str,
    request_token: str | None = None,
    status: str | None = None,
):
    """OAuth callback from the broker after user logs in."""
    return _handle_callback(broker_name, request_token, status)


@router.get("/callback")
def callback_default(
    request_token: str | None = None,
    status: str | None = None,
):
    """Fallback callback without broker name -- assumes Zerodha (matches redirect URL on Kite app)."""
    return _handle_callback("zerodha", request_token, status)


def _handle_callback(broker_name: str, request_token: str | None, status: str | None):
    settings = get_settings()

    try:
        broker = broker_manager.get_broker(broker_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if broker_name == "zerodha" and (status != "success" or not request_token):
        raise HTTPException(status_code=400, detail="Login failed or was cancelled")

    if not request_token:
        raise HTTPException(status_code=400, detail="No request token received")

    try:
        broker.generate_session(request_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")

    return RedirectResponse(url=f"{settings.frontend_url}/dashboard?connected={broker_name}")


@router.get("/status")
def auth_status():
    """Check connection status of all brokers."""
    return {"brokers": broker_manager.get_status()}


@router.post("/logout/{broker_name}")
def logout(broker_name: str):
    """Disconnect a specific broker."""
    try:
        broker = broker_manager.get_broker(broker_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    broker.logout()
    return {"status": "logged_out", "broker": broker_name}
