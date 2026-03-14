from kiteconnect import KiteConnect
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class KiteService:
    """Singleton wrapper around the Kite Connect SDK.
    
    Access token is set once per day after OAuth login and reused
    for all subsequent API calls until it expires (~6-8 AM next day).
    """

    def __init__(self):
        settings = get_settings()
        self._kite = KiteConnect(api_key=settings.kite_api_key)
        self._access_token: str | None = None

    @property
    def is_connected(self) -> bool:
        return self._access_token is not None

    @property
    def login_url(self) -> str:
        return self._kite.login_url()

    def generate_session(self, request_token: str) -> dict:
        settings = get_settings()
        data = self._kite.generate_session(
            request_token, api_secret=settings.kite_api_secret
        )
        self._access_token = data["access_token"]
        self._kite.set_access_token(self._access_token)
        logger.info("Kite session established successfully")
        return data

    def get_holdings(self) -> list[dict]:
        self._ensure_connected()
        return self._kite.holdings()

    def get_positions(self) -> dict:
        self._ensure_connected()
        return self._kite.positions()

    def place_sell_order(
        self,
        tradingsymbol: str,
        exchange: str,
        quantity: int,
        product: str = "CNC",
    ) -> str:
        self._ensure_connected()
        order_id = self._kite.place_order(
            variety=self._kite.VARIETY_REGULAR,
            tradingsymbol=tradingsymbol,
            exchange=exchange,
            transaction_type=self._kite.TRANSACTION_TYPE_SELL,
            quantity=quantity,
            order_type=self._kite.ORDER_TYPE_MARKET,
            product=product,
        )
        logger.info(f"Sell order placed: {tradingsymbol} x{quantity} -> order_id={order_id}")
        return order_id

    def get_profile(self) -> dict:
        self._ensure_connected()
        return self._kite.profile()

    def logout(self):
        if self._access_token:
            try:
                self._kite.invalidate_access_token(self._access_token)
            except Exception:
                pass
            self._access_token = None
            logger.info("Kite session invalidated")

    def _ensure_connected(self):
        if not self.is_connected:
            raise RuntimeError("Not connected to Zerodha. Please login first.")


kite_service = KiteService()
