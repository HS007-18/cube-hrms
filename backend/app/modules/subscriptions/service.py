# Subscriptions service
from datetime import UTC, date, datetime

from sqlalchemy import select

from app.core.errors import not_found
from app.modules.subscriptions.models import Invoice, Subscription


async def list_subscriptions(session) -> list[Subscription]:
    stmt = select(Subscription).order_by(Subscription.created_at.desc())
    return (await session.execute(stmt)).scalars().all()


async def get_subscription(session, subscription_id: int) -> Subscription:
    stmt = select(Subscription).where(Subscription.id == subscription_id)
    subscription = (await session.execute(stmt)).scalar_one_or_none()
    if subscription is None:
        raise not_found("Subscription")
    return subscription


async def create_subscription(session, payload) -> Subscription:
    subscription = Subscription(**payload.model_dump())
    session.add(subscription)
    await session.flush()
    await session.refresh(subscription)
    return subscription


async def update_subscription(session, subscription_id: int, payload) -> Subscription:
    subscription = await get_subscription(session, subscription_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(subscription, key, value)
    subscription.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(subscription)
    return subscription


async def cancel_subscription(
    session, subscription_id: int, reason: str, user_id: int
) -> Subscription:
    subscription = await get_subscription(session, subscription_id)
    subscription.status = "cancelled"
    subscription.cancelled_at = date.today()
    subscription.cancelled_reason = reason
    subscription.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(subscription)
    return subscription


async def list_invoices(
    session,
    tenant_id: int | None = None,
    status_filter: str | None = None,
) -> list[Invoice]:
    stmt = select(Invoice)
    if tenant_id:
        stmt = stmt.where(Invoice.tenant_id == tenant_id)
    if status_filter:
        stmt = stmt.where(Invoice.status == status_filter)
    stmt = stmt.order_by(Invoice.created_at.desc())
    return (await session.execute(stmt)).scalars().all()


async def create_invoice(session, payload) -> Invoice:
    # Generate invoice number
    today = date.today()
    invoice_number = f"INV-{today.strftime('%Y%m')}-{datetime.now(UTC).strftime('%H%M%S')}"
    
    invoice = Invoice(
        invoice_number=invoice_number,
        **payload.model_dump(),
    )
    session.add(invoice)
    await session.flush()
    await session.refresh(invoice)
    return invoice


async def update_invoice(session, invoice_id: int, payload) -> Invoice:
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    invoice = (await session.execute(stmt)).scalar_one_or_none()
    if invoice is None:
        raise not_found("Invoice")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, key, value)
    invoice.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(invoice)
    return invoice


async def pay_invoice(
    session,
    invoice_id: int,
    payment_method: str,
    payment_reference: str,
    user_id: int,
) -> Invoice:
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    invoice = (await session.execute(stmt)).scalar_one_or_none()
    if invoice is None:
        raise not_found("Invoice")
    
    invoice.status = "paid"
    invoice.paid_at = datetime.now(UTC)
    invoice.paid_amount = invoice.total_amount
    invoice.payment_method = payment_method
    invoice.payment_reference = payment_reference
    invoice.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(invoice)
    return invoice