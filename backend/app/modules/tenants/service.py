import secrets
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import bad_request, conflict, not_found
from app.core.security import hash_password
from app.modules.audit import service as audit
from app.modules.auth.models import User, UserRole
from app.modules.employees.models import Employee
from app.modules.leave.models import LeaveRequest, LeaveStatus, LeaveType
from app.modules.org.models import Department, Designation
from app.modules.tenants.models import Tenant, TenantStatus
from app.modules.tenants.schemas import (
    CreateTenantResult,
    ProvisionResult,
    TenantDetail,
    TenantOut,
)

DEFAULT_DEPARTMENTS = ["Administration", "Human Resources", "Finance", "Operations"]
DEFAULT_DESIGNATIONS = [
    ("Executive", 1),
    ("Senior Executive", 2),
    ("Manager", 3),
    ("Head of Department", 4),
]
DEFAULT_LEAVE_TYPES = [
    ("Casual Leave", "casual", Decimal("12.0")),
    ("Sick Leave", "sick", Decimal("8.0")),
    ("Earned Leave", "earned", Decimal("15.0")),
]

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    TenantStatus.PENDING.value: {TenantStatus.CANCELLED.value},
    TenantStatus.ACTIVE.value: {TenantStatus.SUSPENDED.value, TenantStatus.CANCELLED.value},
    TenantStatus.SUSPENDED.value: {TenantStatus.ACTIVE.value, TenantStatus.CANCELLED.value},
    TenantStatus.CANCELLED.value: set(),
}


def generate_temporary_password() -> str:
    return f"Cube-{secrets.token_urlsafe(9)}-1!"


async def _active_employee_counts(
    session: AsyncSession, tenant_ids: list[int]
) -> dict[int, int]:
    if not tenant_ids:
        return {}
    rows = await session.execute(
        select(Employee.tenant_id, func.count(Employee.id))
        .where(Employee.tenant_id.in_(tenant_ids), Employee.is_active.is_(True))
        .group_by(Employee.tenant_id)
    )
    return {tenant_id: count for tenant_id, count in rows.all()}


async def list_tenants(
    session: AsyncSession,
    *,
    status: str | None = None,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[TenantOut], int]:
    filters = []
    if status is not None:
        filters.append(Tenant.status == status)
    if q:
        pattern = f"%{q.strip().lower()}%"
        filters.append(
            func.lower(Tenant.name).like(pattern) | func.lower(Tenant.slug).like(pattern)
        )

    total = (
        await session.execute(select(func.count()).select_from(Tenant).where(*filters))
    ).scalar_one()
    tenants = (
        (
            await session.execute(
                select(Tenant)
                .where(*filters)
                .order_by(Tenant.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
        )
        .scalars()
        .all()
    )
    counts = await _active_employee_counts(session, [tenant.id for tenant in tenants])
    items = [
        TenantOut.model_validate(tenant).model_copy(
            update={"employee_count": counts.get(tenant.id, 0)}
        )
        for tenant in tenants
    ]
    return items, total


async def get_tenant(session: AsyncSession, tenant_id: int) -> Tenant:
    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        raise not_found("Tenant")
    return tenant


async def tenant_detail(session: AsyncSession, tenant_id: int) -> TenantDetail:
    tenant = await get_tenant(session, tenant_id)
    counts = await _active_employee_counts(session, [tenant.id])
    pending = (
        await session.execute(
            select(func.count())
            .select_from(LeaveRequest)
            .where(
                LeaveRequest.tenant_id == tenant.id,
                LeaveRequest.status == LeaveStatus.PENDING.value,
            )
        )
    ).scalar_one()
    owner = (
        await session.execute(
            select(User)
            .where(User.tenant_id == tenant.id, User.role == UserRole.HR_ADMIN.value)
            .order_by(User.id)
            .limit(1)
        )
    ).scalar_one_or_none()
    return TenantDetail(
        **TenantOut.model_validate(tenant).model_dump(exclude={"employee_count"}),
        employee_count=counts.get(tenant.id, 0),
        pending_leave_requests=pending,
        owner_name=owner.full_name if owner else None,
        owner_email=owner.email if owner else None,
    )


async def create_tenant(
    session: AsyncSession, *, payload, actor
) -> CreateTenantResult:
    slug = payload.slug.strip().lower()
    email = str(payload.owner_email).strip().lower()
    existing_slug = (
        await session.execute(select(Tenant.id).where(Tenant.slug == slug))
    ).scalar_one_or_none()
    if existing_slug is not None:
        raise conflict("A tenant with this slug already exists")
    existing_user = (
        await session.execute(select(User.id).where(func.lower(User.email) == email))
    ).scalar_one_or_none()
    if existing_user is not None:
        raise conflict("A user with this email already exists")

    temporary_password = generate_temporary_password()
    tenant = Tenant(
        name=payload.name.strip(),
        slug=slug,
        status=TenantStatus.PENDING.value,
        plan=payload.plan.value,
        contact_email=str(payload.contact_email).strip().lower(),
    )
    session.add(tenant)
    await session.flush()

    owner = User(
        tenant_id=tenant.id,
        email=email,
        full_name=payload.owner_name.strip(),
        hashed_password=hash_password(temporary_password),
        role=UserRole.HR_ADMIN.value,
        is_active=False,  # activated when the tenant is provisioned
    )
    session.add(owner)
    await session.flush()

    await audit.record(
        session,
        actor=actor,
        action="tenant.created",
        entity_type="tenant",
        entity_id=tenant.id,
        meta={"slug": slug, "plan": tenant.plan, "owner_email": email},
        tenant_id=tenant.id,
    )
    return CreateTenantResult(
        tenant=TenantOut.model_validate(tenant),
        owner_email=email,
        temporary_password=temporary_password,
    )


async def _seed_defaults(session: AsyncSession, tenant_id: int) -> None:
    has_departments = (
        await session.execute(select(Department.id).where(Department.tenant_id == tenant_id))
    ).first()
    if has_departments is None:
        session.add_all(
            [Department(tenant_id=tenant_id, name=name) for name in DEFAULT_DEPARTMENTS]
        )

    has_designations = (
        await session.execute(select(Designation.id).where(Designation.tenant_id == tenant_id))
    ).first()
    if has_designations is None:
        session.add_all(
            [
                Designation(tenant_id=tenant_id, title=title, level=level)
                for title, level in DEFAULT_DESIGNATIONS
            ]
        )

    has_leave_types = (
        await session.execute(select(LeaveType.id).where(LeaveType.tenant_id == tenant_id))
    ).first()
    if has_leave_types is None:
        session.add_all(
            [
                LeaveType(
                    tenant_id=tenant_id,
                    name=name,
                    code=code,
                    annual_quota_days=quota,
                )
                for name, code, quota in DEFAULT_LEAVE_TYPES
            ]
        )


async def provision_tenant(
    session: AsyncSession, *, tenant_id: int, actor
) -> ProvisionResult:
    tenant = await get_tenant(session, tenant_id)
    if tenant.status != TenantStatus.PENDING.value:
        raise conflict(f"Tenant is '{tenant.status}', only pending tenants can be provisioned")

    await _seed_defaults(session, tenant.id)

    owner = (
        await session.execute(
            select(User)
            .where(User.tenant_id == tenant.id, User.role == UserRole.HR_ADMIN.value)
            .order_by(User.id)
            .limit(1)
        )
    ).scalar_one_or_none()
    if owner is None:
        raise bad_request("Tenant has no owner account to activate")

    owner.is_active = True
    tenant.status = TenantStatus.ACTIVE.value

    await audit.record(
        session,
        actor=actor,
        action="tenant.provisioned",
        entity_type="tenant",
        entity_id=tenant.id,
        meta={"slug": tenant.slug, "owner_email": owner.email},
        tenant_id=tenant.id,
    )
    return ProvisionResult(
        tenant=TenantOut.model_validate(tenant),
        owner_email=owner.email,
        temporary_password=None,  # password was issued once at tenant creation
    )


async def set_status(
    session: AsyncSession, *, tenant_id: int, status: str, actor
) -> TenantOut:
    tenant = await get_tenant(session, tenant_id)
    if status not in ALLOWED_TRANSITIONS.get(tenant.status, set()):
        raise bad_request(f"Cannot move tenant from '{tenant.status}' to '{status}'")
    previous = tenant.status
    tenant.status = status
    await audit.record(
        session,
        actor=actor,
        action="tenant.status_changed",
        entity_type="tenant",
        entity_id=tenant.id,
        meta={"from": previous, "to": status},
        tenant_id=tenant.id,
    )
    return TenantOut.model_validate(tenant)
