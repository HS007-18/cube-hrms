from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.reports import service
from app.modules.reports.schemas import (
    ReportCreate,
    ReportList,
    ReportOut,
    ReportScheduleCreate,
    ReportScheduleOut,
    ReportScheduleUpdate,
    ReportUpdate,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportList)
async def list_reports(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_reports(ctx.session, ctx.tenant_id, status_filter, limit, offset)


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate,
    background_tasks: BackgroundTasks,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.create_report(
        ctx.session, ctx.tenant_id, ctx.user_id, payload, background_tasks
    )


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: int,
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.get_report(ctx.session, ctx.tenant_id, report_id)


@router.patch("/{report_id}", response_model=ReportOut)
async def update_report(
    report_id: int,
    payload: ReportUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_report(ctx.session, ctx.tenant_id, report_id, payload)


@router.post("/{report_id}/generate", response_model=ReportOut)
async def generate_report(
    report_id: int,
    background_tasks: BackgroundTasks,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.generate_report(ctx.session, ctx.tenant_id, report_id, background_tasks)


@router.get("/schedules", response_model=list[ReportScheduleOut])
async def list_schedules(
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.list_schedules(ctx.session, ctx.tenant_id)


@router.post("/schedules", response_model=ReportScheduleOut, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    payload: ReportScheduleCreate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.create_schedule(ctx.session, ctx.tenant_id, ctx.user_id, payload)


@router.patch("/schedules/{schedule_id}", response_model=ReportScheduleOut)
async def update_schedule(
    schedule_id: int,
    payload: ReportScheduleUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.update_schedule(ctx.session, ctx.tenant_id, schedule_id, payload)


@router.post(
    "/schedules/{schedule_id}/run", response_model=ReportOut,
    status_code=status.HTTP_201_CREATED,
)
async def run_schedule(
    schedule_id: int,
    background_tasks: BackgroundTasks,
    ctx: AuthContext = Depends(require_roles("hr_admin", "manager")),
):
    return await service.run_schedule(ctx.session, ctx.tenant_id, schedule_id, background_tasks)