from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.broker_manager import broker_manager

router = APIRouter()


class SellRequest(BaseModel):
    """Payload for sell orders.

    symbols: list of symbols to sell, or None for all.
    broker: specific broker name, or None for all connected brokers.
    variety: "regular" (market hours) or "amo" (after market).
    """
    symbols: list[str] | None = None
    broker: str | None = None
    variety: str = "regular"


@router.post("/panic-sell")
def panic_sell(req: SellRequest):
    """Place sell orders across one or all brokers."""
    if req.variety not in ("regular", "amo"):
        raise HTTPException(status_code=400, detail="variety must be 'regular' or 'amo'")

    connected = broker_manager.get_connected_brokers()
    if not connected:
        raise HTTPException(status_code=401, detail="No brokers connected")

    result = broker_manager.sell_holdings(
        symbols=req.symbols,
        broker_name=req.broker,
        variety=req.variety,
    )

    if result["summary"]["total"] == 0:
        raise HTTPException(status_code=400, detail="No sellable holdings found")

    return result


@router.get("/history")
def order_history(broker: str | None = None):
    """Fetch today's order history from one or all brokers."""
    if broker:
        try:
            b = broker_manager.get_broker(broker)
            if not b.is_connected:
                raise HTTPException(status_code=401, detail=f"{b.display_name} not connected")
            orders = b.get_orders()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=401, detail=str(e))
    else:
        orders = broker_manager.get_all_orders()

    orders.sort(key=lambda o: o.get("placed_at", ""), reverse=True)
    return {"orders": orders}
