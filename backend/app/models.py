"""Import aggregator so Alembic sees every module's tables."""

from app.modules.announcements.models import Announcement
from app.modules.attendance.models import AttendanceRecord
from app.modules.audit.models import AuditLog
from app.modules.auth.models import RefreshToken, User
from app.modules.documents.models import Document
from app.modules.employees.models import Employee
from app.modules.goals.models import Goal, GoalReview
from app.modules.holidays.models import Holiday
from app.modules.leave.models import LeaveBalance, LeaveRequest, LeaveType
from app.modules.offboarding.models import Offboarding, OffboardingTask
from app.modules.onboarding.models import Onboarding, OnboardingTask
from app.modules.org.models import Department, Designation
from app.modules.payroll.models import Payroll, PayrollItem
from app.modules.platform_audit.models import PlatformAuditLog
from app.modules.recruitment.models import Application, Recruitment
from app.modules.reports.models import Report, ReportSchedule
from app.modules.subscriptions.models import Invoice, Subscription
from app.modules.support.models import SupportTicket, TicketComment
from app.modules.system_health.models import SystemAlert, SystemHealthCheck, SystemMetric
from app.modules.tenants.models import Tenant

__all__ = [
    "Announcement",
    "Application",
    "AttendanceRecord",
    "AuditLog",
    "Department",
    "Designation",
    "Document",
    "Employee",
    "Goal",
    "GoalReview",
    "Holiday",
    "Invoice",
    "LeaveBalance",
    "LeaveRequest",
    "LeaveType",
    "Offboarding",
    "OffboardingTask",
    "Onboarding",
    "OnboardingTask",
    "Payroll",
    "PayrollItem",
    "PlatformAuditLog",
    "Recruitment",
    "RefreshToken",
    "Report",
    "ReportSchedule",
    "Subscription",
    "SupportTicket",
    "SystemAlert",
    "SystemHealthCheck",
    "SystemMetric",
    "Tenant",
    "TicketComment",
    "Tenant",
    "User",
]
