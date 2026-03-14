from kiteconnect import KiteConnect
from app.services.broker_base import BrokerBase
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class ZerodhaBroker(BrokerBase):
    name = "zerodha"
    display_name = "Zerodha"

    def __init__(self):
        settings = get_settings()
        self._kite = KiteConnect(api_key=settings.kite_api_key)
        self._access_token: str | None = None

    @property
    def is_connected(self) -> bool:
        return self._access_token is not None

    def get_login_url(self) -> str:
        return self._kite.login_url()

    def generate_session(self, request_token: str) -> dict:
        settings = get_settings()
        data = self._kite.generate_session(
            request_token, api_secret=settings.kite_api_secret
        )
        self._access_token = data["access_token"]
        self._kite.set_access_token(self._access_token)
        logger.info("Zerodha session established")
        return data

    def get_holdings(self) -> list[dict]:
        self._ensure_connected()
        raw = self._kite.holdings()
        holdings = []
        for h in raw:
            settled_qty = h.get("quantity", 0)
            t1_qty = h.get("t1_quantity", 0)
            total_qty = settled_qty + t1_qty
            if total_qty <= 0:
                continue

            avg_price = h.get("average_price", 0)
            last_price = h.get("last_price", 0)

            holdings.append({
                "tradingsymbol": h.get("tradingsymbol"),
                "exchange": h.get("exchange", "NSE"),
                "isin": h.get("isin"),
                "quantity": settled_qty,
                "t1_quantity": t1_qty,
                "total_quantity": total_qty,
                "average_price": round(avg_price, 2),
                "last_price": round(last_price, 2),
                "pnl": round(h.get("pnl", 0), 2),
                "pnl_percentage": round(
                    ((last_price - avg_price) / avg_price * 100) if avg_price > 0 else 0, 2
                ),
                "day_change": round(h.get("day_change", 0), 2),
                "day_change_percentage": round(h.get("day_change_percentage", 0), 2),
                "product": h.get("product", "CNC"),
                "is_t1": settled_qty == 0 and t1_qty > 0,
                "broker": self.name,
            })
        return holdings

    def place_sell_order(
        self,
        tradingsymbol: str,
        exchange: str,
        quantity: int,
        product: str = "CNC",
        variety: str = "regular",
    ) -> str:
        self._ensure_connected()
        kite_variety = (
            self._kite.VARIETY_AMO if variety == "amo"
            else self._kite.VARIETY_REGULAR
        )
        order_id = self._kite.place_order(
            variety=kite_variety,
            tradingsymbol=tradingsymbol,
            exchange=exchange,
            transaction_type=self._kite.TRANSACTION_TYPE_SELL,
            quantity=quantity,
            order_type=self._kite.ORDER_TYPE_MARKET,
            product=product,
        )
        logger.info(f"[Zerodha] Sell order: {tradingsymbol} x{quantity} variety={variety} -> {order_id}")
        return str(order_id)

    def get_margins(self) -> dict:
        self._ensure_connected()
        data = self._kite.margins("equity")
        return {
            "available_cash": round(data.get("available", {}).get("cash", 0), 2),
            "used_margin": round(data.get("utilised", {}).get("debits", 0), 2),
            "opening_balance": round(data.get("available", {}).get("opening_balance", 0), 2),
            "broker": self.name,
        }

    def get_orders(self) -> list[dict]:
        self._ensure_connected()
        raw = self._kite.orders()
        orders = []
        for o in raw:
            orders.append({
                "order_id": o.get("order_id"),
                "tradingsymbol": o.get("tradingsymbol"),
                "exchange": o.get("exchange"),
                "transaction_type": o.get("transaction_type"),
                "quantity": o.get("quantity", 0),
                "price": o.get("average_price", 0),
                "status": o.get("status", ""),
                "order_type": o.get("order_type"),
                "variety": o.get("variety"),
                "placed_at": o.get("order_timestamp", ""),
                "broker": self.name,
            })
        return orders

    def get_profile(self) -> dict:
        self._ensure_connected()
        p = self._kite.profile()
        return {
            "user_name": p.get("user_name"),
            "user_id": p.get("user_id"),
            "broker": self.name,
        }

    def get_quotes(self, instruments: list[str]) -> dict:
        self._ensure_connected()
        if not instruments:
            return {}
        formatted = [f"NSE:{sym}" for sym in instruments]
        raw = self._kite.ltp(formatted)
        result = {}
        for key, val in raw.items():
            symbol = key.split(":")[-1]
            result[symbol] = {
                "last_price": val.get("last_price", 0),
                "broker": self.name,
            }
        return result

    def logout(self) -> None:
        if self._access_token:
            try:
                self._kite.invalidate_access_token(self._access_token)
            except Exception:
                pass
            self._access_token = None
            logger.info("Zerodha session invalidated")

    def _ensure_connected(self):
        if not self.is_connected:
            raise RuntimeError("Not connected to Zerodha. Please login first.")
