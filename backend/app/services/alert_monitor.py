import json
import time
from pathlib import Path
from datetime import datetime
import zoneinfo
from app.services.broker_manager import broker_manager
from app.services.email_service import send_alert_email
import logging
import threading

logger = logging.getLogger(__name__)

IST = zoneinfo.ZoneInfo("Asia/Kolkata")
CONFIG_FILE = Path(__file__).parent.parent.parent / "alerts_config.json"
COOLDOWN_SECONDS = 3600


def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {"enabled": False, "email": "", "thresholds": {}, "baselines": {}, "last_triggered": {}}


def save_config(config: dict):
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


def check_alerts():
    """Check each connected broker's portfolio against its threshold."""
    config = load_config()
    if not config.get("enabled") or not config.get("email"):
        return

    now = datetime.now(IST)
    if now.weekday() >= 5:
        return
    current_time = now.time()
    from datetime import time as dt_time
    if not (dt_time(9, 15) <= current_time <= dt_time(15, 30)):
        return

    for broker in broker_manager.get_connected_brokers():
        name = broker.name
        threshold = config.get("thresholds", {}).get(name)
        if threshold is None:
            continue

        baseline = config.get("baselines", {}).get(name)
        if baseline is None:
            continue

        last = config.get("last_triggered", {}).get(name, 0)
        if time.time() - last < COOLDOWN_SECONDS:
            continue

        try:
            holdings = broker.get_holdings()
        except Exception:
            continue

        if not holdings:
            continue

        current_value = sum(
            h.get("last_price", 0) * h.get("total_quantity", 0) for h in holdings
        )

        if baseline <= 0:
            continue

        drop_pct = ((current_value - baseline) / baseline) * 100

        if drop_pct > threshold:
            continue

        for h in holdings:
            day_change = h.get("day_change", 0) or 0
            h["day_pnl"] = day_change * h.get("total_quantity", 0)

        sorted_by_day = sorted(holdings, key=lambda h: h.get("day_pnl", 0))
        top_losers = [h for h in sorted_by_day if h.get("day_pnl", 0) < 0][:3]
        top_gainers = [h for h in reversed(sorted_by_day) if h.get("day_pnl", 0) > 0][:3]

        sent = send_alert_email(
            to_email=config["email"],
            broker_name=broker.display_name,
            drop_pct=drop_pct,
            current_value=current_value,
            baseline_value=baseline,
            top_losers=top_losers,
            top_gainers=top_gainers,
        )

        if sent:
            config.setdefault("last_triggered", {})[name] = time.time()
            save_config(config)


def start_alert_loop():
    """Run alert checks every 60 seconds in a background thread."""
    def loop():
        while True:
            try:
                check_alerts()
            except Exception as e:
                logger.error(f"Alert monitor error: {e}")
            time.sleep(60)

    thread = threading.Thread(target=loop, daemon=True, name="alert-monitor")
    thread.start()
    logger.info("Alert monitor started")
