# Notifications service
from datetime import UTC, datetime

from sqlalchemy import func, select

from app.core.errors import not_found
from app.modules.notifications.models import Notification


async def list_notifications(
    session,
    user_id: int,
    is_read: bool | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    stmt = select(Notification).where(Notification.user_id == user_id)
    if is_read is not None:
        stmt = stmt.where(Notification.is_read == is_read)
    
    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()
    
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    items = (await session.execute(stmt)).scalars().all()
    
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def mark_as_read(session, user_id: int, notification_id: int):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    )
    notification = (await session.execute(stmt)).scalar_one_or_none()
    if notification is None:
        raise not_found("Notification")
    
    notification.is_read = True
    notification.read_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(notification)
    return notification


async def mark_all_read(session, user_id: int) -> int:
    stmt = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    )
    notifications = (await session.execute(stmt)).scalars().all()
    count = 0
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.now(UTC)
        count += 1
    await session.flush()
    return count


async def get_preferences(session, user_id: int):
    # Return default preferences for now
    return {
        "email_enabled": True,
        "push_enabled": True,
        "types": [
            "info",
            "success",
            "warning",
            "error",
            "announcement",
            "reminder",
            "approval_request",
            "system",
        ],
    }