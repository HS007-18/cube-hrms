from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import conflict, not_found
from app.modules.org.models import Department, Designation
from app.modules.org.schemas import (
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    DesignationCreate,
    DesignationOut,
    DesignationUpdate,
)


async def list_departments(session: AsyncSession) -> list[DepartmentOut]:
    rows = (
        await session.execute(select(Department).order_by(Department.name))
    ).scalars()
    return [DepartmentOut.model_validate(row) for row in rows]


async def create_department(
    session: AsyncSession, payload: DepartmentCreate
) -> DepartmentOut:
    duplicate = (
        await session.execute(select(Department.id).where(Department.name == payload.name))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise conflict("A department with this name already exists")
    if payload.parent_id is not None and await session.get(Department, payload.parent_id) is None:
        raise not_found("Parent department")
    department = Department(
        name=payload.name.strip(), code=payload.code, parent_id=payload.parent_id
    )
    session.add(department)
    await session.flush()
    return DepartmentOut.model_validate(department)


async def update_department(
    session: AsyncSession, department_id: int, payload: DepartmentUpdate
) -> DepartmentOut:
    department = await session.get(Department, department_id)
    if department is None:
        raise not_found("Department")
    if payload.name is not None and payload.name != department.name:
        duplicate = (
            await session.execute(
                select(Department.id).where(
                    Department.name == payload.name, Department.id != department_id
                )
            )
        ).scalar_one_or_none()
        if duplicate is not None:
            raise conflict("A department with this name already exists")
        department.name = payload.name.strip()
    if payload.code is not None:
        department.code = payload.code
    await session.flush()
    return DepartmentOut.model_validate(department)


async def list_designations(session: AsyncSession) -> list[DesignationOut]:
    rows = (
        await session.execute(select(Designation).order_by(Designation.level.desc()))
    ).scalars()
    return [DesignationOut.model_validate(row) for row in rows]


async def create_designation(
    session: AsyncSession, payload: DesignationCreate
) -> DesignationOut:
    duplicate = (
        await session.execute(select(Designation.id).where(Designation.title == payload.title))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise conflict("A designation with this title already exists")
    designation = Designation(title=payload.title.strip(), level=payload.level)
    session.add(designation)
    await session.flush()
    return DesignationOut.model_validate(designation)


async def update_designation(
    session: AsyncSession, designation_id: int, payload: DesignationUpdate
) -> DesignationOut:
    designation = await session.get(Designation, designation_id)
    if designation is None:
        raise not_found("Designation")
    if payload.title is not None and payload.title != designation.title:
        duplicate = (
            await session.execute(
                select(Designation.id).where(
                    Designation.title == payload.title, Designation.id != designation_id
                )
            )
        ).scalar_one_or_none()
        if duplicate is not None:
            raise conflict("A designation with this title already exists")
        designation.title = payload.title.strip()
    if payload.level is not None:
        designation.level = payload.level
    await session.flush()
    return DesignationOut.model_validate(designation)
