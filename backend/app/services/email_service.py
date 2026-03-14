import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


def send_alert_email(
    to_email: str,
    broker_name: str,
    drop_pct: float,
    current_value: float,
    baseline_value: float,
    top_losers: list[dict],
    top_gainers: list[dict],
):
    settings = get_settings()

    if not settings.smtp_email or not settings.smtp_app_password:
        logger.warning("SMTP credentials not configured, skipping email alert")
        return False

    drop_amount = current_value - baseline_value
    subject = f"[PanicSell Alert] {broker_name} portfolio down {drop_pct:+.1f}%"

    losers_text = ""
    for s in top_losers[:3]:
        losers_text += (
            f"  {s['tradingsymbol']:15s} {s['day_change_percentage']:+.1f}%  "
            f"({s['day_pnl']:+,.0f})   {s['total_quantity']} shares\n"
        )

    gainers_text = ""
    for s in top_gainers[:3]:
        gainers_text += (
            f"  {s['tradingsymbol']:15s} {s['day_change_percentage']:+.1f}%  "
            f"({s['day_pnl']:+,.0f})   {s['total_quantity']} shares\n"
        )

    body = f"""Your {broker_name} portfolio has dropped below your {drop_pct:.0f}% threshold.

Portfolio: Rs {current_value:,.0f} (was Rs {baseline_value:,.0f} at baseline)
Drop: Rs {drop_amount:+,.0f} ({drop_pct:+.1f}%)

Biggest Losers:
{losers_text if losers_text else '  (none)'}
Gainers:
{gainers_text if gainers_text else '  (none)'}
Log into PanicSell to take action: http://localhost:5173
"""

    msg = MIMEMultipart()
    msg["From"] = settings.smtp_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.smtp_email, settings.smtp_app_password)
            server.send_message(msg)
        logger.info(f"Alert email sent to {to_email} for {broker_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")
        return False
