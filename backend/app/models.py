"""Import aggregator so Alembic sees every module's tables."""

from app.modules.attendance.models import AttendanceRecord
from app.modules.audit.models import AuditLog
from app.modules.auth.models import RefreshToken, User
from app.modules.employees.models import Employee
from app.modules.leave.models import LeaveBalance, LeaveRequest, LeaveType
from app.modules.org.models import Department, Designation
from app.modules.tenants.models import Tenant

__all__ = [
    "AttendanceRecord",
    "AuditLog",
    "Department",
    "Designation",
    "Employee",
    "LeaveBalance",
    "LeaveRequest",
    "LeaveType",
    "RefreshToken",
    "Tenant",
    "User",
]
