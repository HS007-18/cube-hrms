from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.core.errors import not_found
from app.core.pagination import Page
from app.modules.employees import service
from app.modules.employees.schemas import (
    EmployeeCreate,
    EmployeeCreated,
    EmployeeOut,
    EmployeeUpdate,
)

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=Page[EmployeeOut])
async def list_employees(
    q: str | None = Query(default=None, max_length=120),
    department_id: int | None = None,
    designation_id: int | None = None,
    include_inactive: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> Page[EmployeeOut]:
    items, total = await service.list_employees(
        ctx.session,
        q=q,
        department_id=department_id,
        designation_id=designation_id,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
    )
    return Page[EmployeeOut](items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=EmployeeCreated, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> EmployeeCreated:
    return await service.create_employee(ctx.session, payload=payload, actor=ctx.user)


@router.get("/me", response_model=EmployeeOut)
async def my_employee_profile(
    ctx: AuthContext = Depends(require_tenant_user),
) -> EmployeeOut:
    employee = await service.employee_for_user(ctx.session, ctx.user.id)
    if employee is None:
        raise not_found("Employee profile")
    return await service.get_employee(ctx.session, employee.id)


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: int,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> EmployeeOut:
    return await service.get_employee(ctx.session, employee_id)


@router.patch("/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> EmployeeOut:
    return await service.update_employee(
        ctx.session, employee_id=employee_id, payload=payload, actor=ctx.user
    )
