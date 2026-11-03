# Payroll service
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.errors import not_found
from app.modules.payroll.models import Payroll, PayrollItem


async def list_payrolls(
    session,
    tenant_id: int,
    limit: int = 20,
    offset: int = 0,
) -> list:
    stmt = select(Payroll).where(Payroll.tenant_id == tenant_id)
    stmt = stmt.order_by(Payroll.created_at.desc()).limit(limit).offset(offset)
    return (await session.execute(stmt)).scalars().all()


async def get_payroll(session, tenant_id: int, payroll_id: int):
    stmt = select(Payroll).where(
        Payroll.id == payroll_id,
        Payroll.tenant_id == tenant_id,
    )
    payroll = (await session.execute(stmt)).scalar_one_or_none()
    if payroll is None:
        raise not_found("Payroll")
    return payroll


async def create_payroll(session, tenant_id: int, payload, created_by: int):
    payroll = Payroll(
        tenant_id=tenant_id,
        **payload.model_dump(),
    )
    session.add(payroll)
    await session.flush()
    await session.refresh(payroll)
    return payroll


async def update_payroll(session, tenant_id: int, payroll_id: int, payload, user_id: int):
    stmt = select(Payroll).where(
        Payroll.id == payroll_id,
        Payroll.tenant_id == tenant_id,
    )
    payroll = (await session.execute(stmt)).scalar_one_or_none()
    if payroll is None:
        raise not_found("Payroll")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(payroll, key, value)
    payroll.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(payroll)
    return payroll


async def add_payroll_item(session, tenant_id: int, payroll_id: int, payload):
    stmt = select(Payroll).where(
        Payroll.id == payroll_id,
        Payroll.tenant_id == tenant_id,
    )
    payroll = (await session.execute(stmt)).scalar_one_or_none()
    if payroll is None:
        raise not_found("Payroll")
    
    item = PayrollItem(
        tenant_id=tenant_id,
        payroll_id=payroll_id,
        **payload.model_dump(),
    )
    session.add(item)
    await session.flush()
    await session.refresh(item)
    return item


async def process_payroll(session, tenant_id: int, payroll_id: int, user_id: int):
    stmt = select(Payroll).where(
        Payroll.id == payroll_id,
        Payroll.tenant_id == tenant_id,
    )
    payroll = (await session.execute(stmt)).scalar_one_or_none()
    if payroll is None:
        raise not_found("Payroll")
    
    payroll.status = "completed"
    payroll.processed_by = user_id
    payroll.processed_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(payroll)
    return payroll