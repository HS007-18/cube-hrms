import logging

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="notifications.send")
def send_notification(email: str, subject: str, body: str) -> str:
    """Delivery stub: Wave 2 wires SMTP / WhatsApp Business API here."""
    logger.info("notification queued to=%s subject=%s", email, subject)
    return f"queued:{email}:{subject}"


@celery_app.task(name="system.heartbeat")
def heartbeat() -> str:
    return "ok"
