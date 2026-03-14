from growwapi import GrowwAPI
from app.services.broker_base import BrokerBase
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class GrowwBroker(BrokerBase):
    name = "groww"
    display_name = "Groww"

    def __init__(self):
        self._groww: GrowwAPI | None = None
        self._access_token: str | None = None

    @property
    def is_connected(self) -> bool:
        return self._groww is not None and self._access_token is not None

    def get_login_url(self) -> str:
        """Groww uses API key+secret auth, not OAuth redirect.
        Returns empty -- frontend should call /api/auth/connect/groww instead."""
        return ""

    def generate_session(self, request_token: str = "") -> dict:
        """Generate session via TOTP flow (preferred) or API key+secret fallback.
        request_token is ignored -- Groww doesn't use OAuth flow."""
        settings = get_settings()

        if settings.groww_totp_token and settings.groww_totp_secret:
            import pyotp
            totp_gen = pyotp.TOTP(settings.groww_totp_secret)
            totp = totp_gen.now()
            self._access_token = GrowwAPI.get_access_token(
                api_key=settings.groww_totp_token, totp=totp
            )
            logger.info("Groww session established via TOTP (no daily approval needed)")
        elif settings.groww_api_key and settings.groww_api_secret:
            self._access_token = GrowwAPI.get_access_token(
                api_key=settings.groww_api_key, secret=settings.groww_api_secret
            )
            logger.info("Groww session established via API key+secret")
        else:
            raise RuntimeError(
                "Groww credentials not configured. "
                "Set GROWW_TOTP_TOKEN + GROWW_TOTP_SECRET (recommended) "
                "or GROWW_API_KEY + GROWW_API_SECRET in .env"
            )

        self._groww = GrowwAPI(self._access_token)
        return {"access_token": self._access_token}

    def get_holdings(self) -> list[dict]:
        self._ensure_connected()
        raw = self._groww.get_holdings_for_user()
        raw_holdings = raw.get("holdings", []) if isinstance(raw, dict) else raw

        holdings = []
        for h in raw_holdings:
            qty = int(h.get("quantity", 0))
            t1_qty = int(h.get("t1_quantity", 0))
            total_qty = qty + t1_qty
            if total_qty <= 0:
                continue

            avg_price = float(h.get("average_price", 0))
            symbol = h.get("trading_symbol", "")

            ltp = self._get_ltp_for_symbol(symbol)

            pnl = (ltp - avg_price) * total_qty if avg_price > 0 else 0
            pnl_pct = ((ltp - avg_price) / avg_price * 100) if avg_price > 0 else 0

            holdings.append({
                "tradingsymbol": symbol,
                "exchange": "NSE",
                "isin": h.get("isin", ""),
                "quantity": qty,
                "t1_quantity": t1_qty,
                "total_quantity": total_qty,
                "average_price": round(avg_price, 2),
                "last_price": round(ltp, 2),
                "pnl": round(pnl, 2),
                "pnl_percentage": round(pnl_pct, 2),
                "day_change": 0,
                "day_change_percentage": 0,
                "product": "CNC",
                "is_t1": qty == 0 and t1_qty > 0,
                "broker": self.name,
            })

        self._enrich_day_change(holdings)
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
        resp = self._groww.place_order(
            trading_symbol=tradingsymbol,
            quantity=quantity,
            validity=GrowwAPI.VALIDITY_DAY,
            exchange=self._to_groww_exchange(exchange),
            segment=GrowwAPI.SEGMENT_CASH,
            product=GrowwAPI.PRODUCT_CNC,
            order_type=GrowwAPI.ORDER_TYPE_MARKET,
            transaction_type=GrowwAPI.TRANSACTION_TYPE_SELL,
        )
        order_id = resp.get("groww_order_id", "")
        logger.info(f"[Groww] Sell order: {tradingsymbol} x{quantity} variety={variety} -> {order_id}")
        return str(order_id)

    def get_margins(self) -> dict:
        self._ensure_connected()
        data = self._groww.get_available_margin_details()
        equity = data.get("equity_margin_details", {})
        return {
            "available_cash": round(float(data.get("clear_cash", 0)), 2),
            "used_margin": round(abs(float(data.get("net_margin_used", 0))), 2),
            "opening_balance": round(
                float(equity.get("cnc_balance_available", 0)), 2
            ),
            "broker": self.name,
        }

    def get_orders(self) -> list[dict]:
        self._ensure_connected()
        raw = self._groww.get_order_list()
        raw_orders = raw.get("order_list", []) if isinstance(raw, dict) else raw

        orders = []
        for o in raw_orders:
            orders.append({
                "order_id": o.get("groww_order_id", ""),
                "tradingsymbol": o.get("trading_symbol", ""),
                "exchange": o.get("exchange", "NSE"),
                "transaction_type": o.get("transaction_type", ""),
                "quantity": int(o.get("quantity", 0)),
                "price": float(o.get("average_fill_price", 0)),
                "status": self._map_order_status(o.get("order_status", "")),
                "order_type": o.get("order_type", ""),
                "variety": "AMO" if o.get("amo_status") not in (None, "NA") else "regular",
                "placed_at": o.get("created_at", ""),
                "broker": self.name,
            })
        return orders

    def get_profile(self) -> dict:
        self._ensure_connected()
        p = self._groww.get_user_profile()
        return {
            "user_name": p.get("ucc", "Groww User"),
            "user_id": p.get("vendor_user_id", ""),
            "broker": self.name,
        }

    def get_quotes(self, instruments: list[str]) -> dict:
        self._ensure_connected()
        if not instruments:
            return {}
        exchange_symbols = tuple(f"NSE_{sym}" for sym in instruments)
        try:
            raw = self._groww.get_ltp(
                segment=GrowwAPI.SEGMENT_CASH,
                exchange_trading_symbols=exchange_symbols,
            )
        except Exception as e:
            logger.error(f"[Groww] Failed to get LTP: {e}")
            return {}

        result = {}
        for key, val in raw.items():
            symbol = key.replace("NSE_", "").replace("BSE_", "")
            price = val if isinstance(val, (int, float)) else val.get("last_price", 0)
            result[symbol] = {"last_price": float(price), "broker": self.name}
        return result

    def logout(self) -> None:
        self._groww = None
        self._access_token = None
        logger.info("Groww session cleared")

    def _ensure_connected(self):
        if not self.is_connected:
            raise RuntimeError("Not connected to Groww. Please login first.")

    def _get_ltp_for_symbol(self, symbol: str) -> float:
        try:
            raw = self._groww.get_ltp(
                segment=GrowwAPI.SEGMENT_CASH,
                exchange_trading_symbols=(f"NSE_{symbol}",),
            )
            val = raw.get(f"NSE_{symbol}", 0)
            return float(val) if isinstance(val, (int, float)) else float(val.get("last_price", 0))
        except Exception:
            return 0.0

    def _enrich_day_change(self, holdings: list[dict]) -> None:
        """Fetch quotes to fill in day_change fields."""
        symbols = [h["tradingsymbol"] for h in holdings]
        if not symbols:
            return
        exchange_symbols = tuple(f"NSE_{s}" for s in symbols)
        try:
            raw = self._groww.get_quote(
                exchange=GrowwAPI.EXCHANGE_NSE,
                segment=GrowwAPI.SEGMENT_CASH,
                trading_symbol=symbols[0],
            )
            pass
        except Exception:
            pass

    @staticmethod
    def _to_groww_exchange(exchange: str) -> str:
        mapping = {"NSE": GrowwAPI.EXCHANGE_NSE, "BSE": GrowwAPI.EXCHANGE_BSE}
        return mapping.get(exchange.upper(), GrowwAPI.EXCHANGE_NSE)

    @staticmethod
    def _map_order_status(status: str) -> str:
        mapping = {
            "EXECUTED": "COMPLETE",
            "COMPLETED": "COMPLETE",
            "REJECTED": "REJECTED",
            "FAILED": "REJECTED",
            "CANCELLED": "CANCELLED",
            "NEW": "OPEN",
            "ACKED": "OPEN",
            "OPEN": "OPEN",
            "APPROVED": "OPEN",
            "TRIGGER_PENDING": "TRIGGER PENDING",
        }
        return mapping.get(status.upper(), status)
