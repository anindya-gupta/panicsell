from app.services.broker_base import BrokerBase
from app.services.zerodha_broker import ZerodhaBroker
from app.services.groww_broker import GrowwBroker
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class BrokerManager:
    """Orchestrates multiple broker connections and merges their data."""

    def __init__(self):
        settings = get_settings()
        self.brokers: dict[str, BrokerBase] = {
            "zerodha": ZerodhaBroker(),
        }
        has_groww_totp = settings.groww_totp_token and settings.groww_totp_secret
        has_groww_key = settings.groww_api_key and settings.groww_api_secret
        if has_groww_totp or has_groww_key:
            self.brokers["groww"] = GrowwBroker()
        else:
            logger.info("Groww credentials not set -- Groww broker disabled. Set GROWW_TOTP_TOKEN + GROWW_TOTP_SECRET or GROWW_API_KEY + GROWW_API_SECRET in .env.")

    def get_broker(self, name: str) -> BrokerBase:
        broker = self.brokers.get(name)
        if not broker:
            raise ValueError(f"Unknown broker: {name}. Available: {list(self.brokers.keys())}")
        return broker

    def get_connected_brokers(self) -> list[BrokerBase]:
        return [b for b in self.brokers.values() if b.is_connected]

    def get_status(self) -> list[dict]:
        statuses = []
        for b in self.brokers.values():
            info = {"broker": b.name, "display_name": b.display_name, "connected": b.is_connected}
            if b.is_connected:
                try:
                    profile = b.get_profile()
                    info["user_name"] = profile.get("user_name")
                    info["user_id"] = profile.get("user_id")
                except Exception:
                    pass
            statuses.append(info)
        return statuses

    def get_all_holdings(self) -> list[dict]:
        holdings = []
        for b in self.get_connected_brokers():
            try:
                holdings.extend(b.get_holdings())
            except Exception as e:
                logger.error(f"Failed to fetch holdings from {b.name}: {e}")
        return holdings

    def get_holdings_by_broker(self, broker_name: str) -> list[dict]:
        broker = self.get_broker(broker_name)
        if not broker.is_connected:
            raise RuntimeError(f"{broker.display_name} is not connected.")
        return broker.get_holdings()

    def get_all_margins(self) -> list[dict]:
        margins = []
        for b in self.get_connected_brokers():
            try:
                margins.append(b.get_margins())
            except Exception as e:
                logger.error(f"Failed to fetch margins from {b.name}: {e}")
        return margins

    def get_all_orders(self) -> list[dict]:
        orders = []
        for b in self.get_connected_brokers():
            try:
                orders.extend(b.get_orders())
            except Exception as e:
                logger.error(f"Failed to fetch orders from {b.name}: {e}")
        return orders

    def sell_holdings(
        self,
        symbols: list[str] | None = None,
        broker_name: str | None = None,
        variety: str = "regular",
    ) -> dict:
        """Sell holdings across one or all brokers.

        Args:
            symbols: Specific symbols to sell. None = sell all.
            broker_name: Specific broker. None = all connected brokers.
            variety: "regular" or "amo"
        """
        if broker_name:
            brokers_to_sell = [self.get_broker(broker_name)]
        else:
            brokers_to_sell = self.get_connected_brokers()

        results = []
        success_count = 0
        fail_count = 0

        for broker in brokers_to_sell:
            if not broker.is_connected:
                continue

            try:
                holdings = broker.get_holdings()
            except Exception as e:
                logger.error(f"Failed to fetch holdings from {broker.name}: {e}")
                continue

            sellable = [h for h in holdings if h.get("total_quantity", 0) > 0]

            if symbols:
                requested = {s.upper() for s in symbols}
                sellable = [h for h in sellable if h["tradingsymbol"].upper() in requested]

            for h in sellable:
                symbol = h["tradingsymbol"]
                exchange = h.get("exchange", "NSE")
                qty = h["total_quantity"]
                product = h.get("product", "CNC")

                try:
                    order_id = broker.place_sell_order(
                        tradingsymbol=symbol,
                        exchange=exchange,
                        quantity=qty,
                        product=product,
                        variety=variety,
                    )
                    results.append({
                        "tradingsymbol": symbol,
                        "quantity": qty,
                        "order_id": order_id,
                        "status": "success",
                        "error": None,
                        "broker": broker.name,
                    })
                    success_count += 1
                except Exception as e:
                    logger.error(f"[{broker.name}] Failed to sell {symbol}: {e}")
                    results.append({
                        "tradingsymbol": symbol,
                        "quantity": qty,
                        "order_id": None,
                        "status": "failed",
                        "error": str(e),
                        "broker": broker.name,
                    })
                    fail_count += 1

        return {
            "results": results,
            "summary": {
                "total": len(results),
                "success": success_count,
                "failed": fail_count,
            },
        }

    def get_all_quotes(self) -> dict:
        all_quotes = {}
        for broker in self.get_connected_brokers():
            try:
                holdings = broker.get_holdings()
                symbols = [h["tradingsymbol"] for h in holdings]
                if symbols:
                    quotes = broker.get_quotes(symbols)
                    all_quotes.update(quotes)
            except Exception as e:
                logger.error(f"Failed to fetch quotes from {broker.name}: {e}")
        return all_quotes


broker_manager = BrokerManager()
