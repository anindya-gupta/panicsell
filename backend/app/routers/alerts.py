from fastapi import APIRouter
from pydantic import BaseModel
from app.services.alert_monitor import load_config, save_config
from app.services.broker_manager import broker_manager

router = APIRouter()


class AlertConfigRequest(BaseModel):
    enabled: bool
    email: str = ""
    thresholds: dict[str, float] = {}


@router.get("/config")
def get_alert_config():
    """Get current alert configuration."""
    return load_config()


@router.post("/config")
def set_alert_config(req: AlertConfigRequest):
    """Update alert configuration and snapshot current portfolio values as baselines."""
    config = load_config()
    config["enabled"] = req.enabled
    config["email"] = req.email
    config["thresholds"] = req.thresholds

    if req.enabled:
        baselines = {}
        for broker in broker_manager.get_connected_brokers():
            try:
                holdings = broker.get_holdings()
                value = sum(
                    h.get("last_price", 0) * h.get("total_quantity", 0) for h in holdings
                )
                baselines[broker.name] = round(value, 2)
            except Exception:
                pass
        config["baselines"] = baselines

    save_config(config)
    return {"status": "updated", "config": config}


@router.post("/reset-baseline")
def reset_baseline():
    """Re-snapshot current portfolio values as new baselines."""
    config = load_config()
    baselines = {}
    for broker in broker_manager.get_connected_brokers():
        try:
            holdings = broker.get_holdings()
            value = sum(
                h.get("last_price", 0) * h.get("total_quantity", 0) for h in holdings
            )
            baselines[broker.name] = round(value, 2)
        except Exception:
            pass
    config["baselines"] = baselines
    save_config(config)
    return {"status": "baselines_reset", "baselines": baselines}
