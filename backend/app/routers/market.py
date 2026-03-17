from fastapi import APIRouter
from datetime import datetime, time
import zoneinfo

router = APIRouter()

IST = zoneinfo.ZoneInfo("Asia/Kolkata")

NSE_HOLIDAYS_2026 = {
    "2026-01-26",  # Republic Day
    "2026-03-03",  # Holi
    "2026-03-26",  # Shri Ram Navami
    "2026-03-31",  # Shri Mahavir Jayanti
    "2026-04-03",  # Good Friday
    "2026-04-14",  # Dr. Baba Saheb Ambedkar Jayanti
    "2026-05-01",  # Maharashtra Day
    "2026-05-28",  # Bakri Id
    "2026-06-26",  # Muharram
    "2026-09-14",  # Ganesh Chaturthi
    "2026-10-02",  # Mahatma Gandhi Jayanti
    "2026-10-20",  # Dussehra
    "2026-11-10",  # Diwali-Balipratipada
    "2026-11-24",  # Prakash Gurpurb Sri Guru Nanak Dev
    "2026-12-25",  # Christmas
}

PRE_OPEN_START = time(9, 0)
MARKET_OPEN = time(9, 15)
MARKET_CLOSE = time(15, 30)
POST_CLOSE_END = time(15, 40)


@router.get("/status")
def market_status():
    """Check if Indian stock market (NSE) is currently open."""
    now = datetime.now(IST)
    current_time = now.time()
    date_str = now.strftime("%Y-%m-%d")
    weekday = now.weekday()

    is_weekend = weekday >= 5
    is_holiday = date_str in NSE_HOLIDAYS_2026

    if is_weekend or is_holiday:
        status = "closed"
        reason = "Weekend" if is_weekend else "Market holiday"
    elif current_time < PRE_OPEN_START:
        status = "closed"
        reason = "Before pre-open session"
    elif current_time < MARKET_OPEN:
        status = "pre_open"
        reason = "Pre-open session (9:00-9:15)"
    elif current_time <= MARKET_CLOSE:
        status = "open"
        reason = "Market hours (9:15-15:30)"
    elif current_time <= POST_CLOSE_END:
        status = "post_close"
        reason = "Post-close session"
    else:
        status = "closed"
        reason = "After market hours"

    is_open = status == "open"
    allows_amo = status == "closed" and not (PRE_OPEN_START <= current_time <= POST_CLOSE_END)

    return {
        "status": status,
        "is_open": is_open,
        "allows_amo": allows_amo,
        "reason": reason,
        "current_time": now.isoformat(),
        "market_open": "09:15",
        "market_close": "15:30",
    }
