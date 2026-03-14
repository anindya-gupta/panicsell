from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.routers import auth, portfolio, orders, market, alerts
from app.services.alert_monitor import start_alert_loop
from app.services.auth_service import validate_token

settings = get_settings()

AUTH_EXEMPT_PATHS = {
    "/api/health",
    "/api/auth/app-login",
    "/api/auth/callback",
}

AUTH_EXEMPT_PREFIXES = (
    "/api/auth/callback/",
    "/api/auth/login/",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_alert_loop()
    yield


app = FastAPI(
    title="PanicSell",
    description="Multi-broker stock liquidation tool",
    version="2.0.0",
    lifespan=lifespan,
)

allowed_origins = [settings.frontend_url]
if settings.frontend_url != "http://localhost:5173":
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if not settings.admin_password:
        return await call_next(request)

    path = request.url.path

    if path in AUTH_EXEMPT_PATHS or path.startswith(AUTH_EXEMPT_PREFIXES):
        return await call_next(request)

    if not path.startswith("/api/"):
        return await call_next(request)

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    token = auth_header[7:]
    if not validate_token(token):
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    return await call_next(request)


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
