from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, portfolio, orders, market, alerts
from app.services.alert_monitor import start_alert_loop

settings = get_settings()


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

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
