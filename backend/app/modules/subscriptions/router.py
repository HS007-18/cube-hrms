from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_platform_admin
from app.modules.subscriptions import service
from app.modules.subscriptions.schemas import (
    InvoiceCreate,
    InvoiceOut,
    InvoiceUpdate,
    SubscriptionCreate,
    SubscriptionOut,
    SubscriptionUpdate,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[SubscriptionOut])
async def list_subscriptions(
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_subscriptions(ctx.session)


@router.post("", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    payload: SubscriptionCreate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.create_subscription(ctx.session, payload)


@router.get("/{subscription_id}", response_model=SubscriptionOut)
async def get_subscription(
    subscription_id: int,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.get_subscription(ctx.session, subscription_id)


@router.patch("/{subscription_id}", response_model=SubscriptionOut)
async def update_subscription(
    subscription_id: int,
    payload: SubscriptionUpdate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.update_subscription(ctx.session, subscription_id, payload)


@router.post("/{subscription_id}/cancel", response_model=SubscriptionOut)
async def cancel_subscription(
    subscription_id: int,
    reason: str,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.cancel_subscription(ctx.session, subscription_id, reason, ctx.user.id)


@router.get("/invoices", response_model=list[InvoiceOut])
async def list_invoices(
    tenant_id: int | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.list_invoices(ctx.session, tenant_id, status_filter)


@router.post("/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.create_invoice(ctx.session, payload)


@router.patch("/invoices/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.update_invoice(ctx.session, invoice_id, payload)


@router.post("/invoices/{invoice_id}/pay", response_model=InvoiceOut)
async def pay_invoice(
    invoice_id: int,
    payment_method: str,
    payment_reference: str,
    ctx: AuthContext = Depends(require_platform_admin),
):
    return await service.pay_invoice(
        ctx.session, invoice_id, payment_method, payment_reference, ctx.user.id
    )