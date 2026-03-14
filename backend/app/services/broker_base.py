from abc import ABC, abstractmethod


class BrokerBase(ABC):
    """Abstract interface that all broker implementations must follow."""

    name: str  # "zerodha" | "groww"
    display_name: str  # "Zerodha" | "Groww"

    @property
    @abstractmethod
    def is_connected(self) -> bool: ...

    @abstractmethod
    def get_login_url(self) -> str: ...

    @abstractmethod
    def generate_session(self, request_token: str) -> dict: ...

    @abstractmethod
    def get_holdings(self) -> list[dict]: ...

    @abstractmethod
    def place_sell_order(
        self,
        tradingsymbol: str,
        exchange: str,
        quantity: int,
        product: str,
        variety: str = "regular",
    ) -> str: ...

    @abstractmethod
    def get_margins(self) -> dict: ...

    @abstractmethod
    def get_orders(self) -> list[dict]: ...

    @abstractmethod
    def get_profile(self) -> dict: ...

    @abstractmethod
    def get_quotes(self, instruments: list[str]) -> dict: ...

    @abstractmethod
    def logout(self) -> None: ...
