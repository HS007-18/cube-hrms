from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.modules.attendance.router import router as attendance_router
from app.modules.auth.router import router as auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.employees.router import router as employees_router
from app.modules.leave.router import router as leave_router
from app.modules.org.router import router as org_router
from app.modules.tenants.router import router as tenants_router

# New modules
from app.modules.announcements.router import router as announcements_router
from app.modules.documents.router import router as documents_router
from app.modules.goals.router import router as goals_router
from app.modules.holidays.router import router as holidays_router
from app.modules.notifications.router import router as notifications_router
from app.modules.offboarding.router import router as offboarding_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.payroll.router import router as payroll_router
from app.modules.platform_audit.router import router as platform_audit_router
from app.modules.recruitment.router import router as recruitment_router
from app.modules.reports.router import router as reports_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.support.router import router as support_router
from app.modules.system_health.router import router as system_health_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Multi-tenant HR platform for Indian SMEs.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = settings.api_prefix
    for router in (
        auth_router,
        tenants_router,
        org_router,
        employees_router,
        attendance_router,
        leave_router,
        dashboard_router,
        # New modules
        payroll_router,
        recruitment_router,
        onboarding_router,
        notifications_router,
        holidays_router,
        documents_router,
        offboarding_router,
        goals_router,
        announcements_router,
        support_router,
        subscriptions_router,
        platform_audit_router,
        system_health_router,
        reports_router,
    ):
        app.include_router(router, prefix=prefix)

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.app_name, "version": settings.app_version}

    @app.get(f"{prefix}/health", tags=["system"])
    async def api_health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Log unhandled exceptions and return a generic 500 without leaking details."""
        import logging
        logging.getLogger("cube.hrms").exception(
            "Unhandled error on %s %s: %s",
            request.method,
            request.url.path,
            exc,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
