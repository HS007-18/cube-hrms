from fastapi import APIRouter, Depends, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.org import service
from app.modules.org.schemas import (
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    DesignationCreate,
    DesignationOut,
    DesignationUpdate,
)

router = APIRouter(tags=["organization"])


@router.get("/departments", response_model=list[DepartmentOut])
async def list_departments(
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[DepartmentOut]:
    return await service.list_departments(ctx.session)


@router.post(
    "/departments",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_department(
    payload: DepartmentCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> DepartmentOut:
    return await service.create_department(ctx.session, payload)


@router.patch("/departments/{department_id}", response_model=DepartmentOut)
async def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> DepartmentOut:
    return await service.update_department(ctx.session, department_id, payload)


@router.get("/designations", response_model=list[DesignationOut])
async def list_designations(
    ctx: AuthContext = Depends(require_tenant_user),
) -> list[DesignationOut]:
    return await service.list_designations(ctx.session)


@router.post(
    "/designations",
    response_model=DesignationOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_designation(
    payload: DesignationCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> DesignationOut:
    return await service.create_designation(ctx.session, payload)


@router.patch("/designations/{designation_id}", response_model=DesignationOut)
async def update_designation(
    designation_id: int,
    payload: DesignationUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
) -> DesignationOut:
    return await service.update_designation(ctx.session, designation_id, payload)
