from fastapi import APIRouter, HTTPException
from app.services.broker_manager import broker_manager

router = APIRouter()


@router.get("/holdings")
def get_holdings(broker: str | None = None):
    """Fetch holdings from one or all connected brokers."""
    try:
        if broker:
            holdings = broker_manager.get_holdings_by_broker(broker)
        else:
            holdings = broker_manager.get_all_holdings()
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch holdings: {e}")

    total_invested = 0.0
    total_current = 0.0

    for h in holdings:
        qty = h.get("total_quantity", 0)
        avg = h.get("average_price", 0)
        ltp = h.get("last_price", 0)
        total_invested += avg * qty
        total_current += ltp * qty

    total_pnl = total_current - total_invested

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current": round(total_current, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_percentage": round(
                (total_pnl / total_invested * 100) if total_invested > 0 else 0, 2
            ),
            "stock_count": len(holdings),
        },
    }


@router.get("/margins")
def get_margins():
    """Fetch funds/margins from all connected brokers."""
    margins = broker_manager.get_all_margins()
    total_cash = sum(m.get("available_cash", 0) for m in margins)
    total_used = sum(m.get("used_margin", 0) for m in margins)
    return {
        "margins": margins,
        "combined": {
            "available_cash": round(total_cash, 2),
            "used_margin": round(total_used, 2),
        },
    }


@router.get("/quotes")
def get_quotes():
    """Fetch latest quotes for all holdings across all brokers."""
    try:
        quotes = broker_manager.get_all_quotes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quotes: {e}")
    return {"quotes": quotes}
