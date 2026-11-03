# Holidays service

from sqlalchemy import func, select

from app.core.errors import not_found
from app.modules.holidays.models import Holiday


async def list_holidays(
    session,
    tenant_id: int,
    year: int | None = None,
) -> list:
    stmt = select(Holiday).where(Holiday.tenant_id == tenant_id)
    if year:
        stmt = stmt.where(
            func.extract('year', Holiday.date) == year
        )
    stmt = stmt.order_by(Holiday.date)
    return (await session.execute(stmt)).scalars().all()


async def create_holiday(session, tenant_id: int, payload) -> Holiday:
    holiday = Holiday(tenant_id=tenant_id, **payload.model_dump())
    session.add(holiday)
    await session.flush()
    await session.refresh(holiday)
    return holiday


async def update_holiday(session, tenant_id: int, holiday_id: int, payload) -> Holiday:
    stmt = select(Holiday).where(
        Holiday.id == holiday_id,
        Holiday.tenant_id == tenant_id,
    )
    holiday = (await session.execute(stmt)).scalar_one_or_none()
    if holiday is None:
        raise not_found("Holiday")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(holiday, key, value)
    await session.flush()
    await session.refresh(holiday)
    return holiday


async def delete_holiday(session, tenant_id: int, holiday_id: int) -> None:
    stmt = select(Holiday).where(
        Holiday.id == holiday_id,
        Holiday.tenant_id == tenant_id,
    )
    holiday = (await session.execute(stmt)).scalar_one_or_none()
    if holiday is None:
        raise not_found("Holiday")
    await session.delete(holiday)