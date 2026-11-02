from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

EmploymentType = Literal["full_time", "part_time", "contract", "intern"]
AccountRole = Literal["employee", "manager", "hr_admin"]


class EmployeeCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    employee_code: str | None = Field(default=None, max_length=40)
    department_id: int | None = None
    designation_id: int | None = None
    manager_id: int | None = None
    date_of_joining: date | None = None
    employment_type: EmploymentType = "full_time"
    pan: str | None = Field(default=None, max_length=10)
    aadhaar_last4: str | None = Field(default=None, min_length=4, max_length=4)
    uan: str | None = Field(default=None, max_length=12)
    esic: str | None = Field(default=None, max_length=17)
    bank_ifsc: str | None = Field(default=None, max_length=11)
    create_account: bool = False
    role: AccountRole = "employee"
    password: str | None = Field(default=None, min_length=8, max_length=128)


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    department_id: int | None = None
    designation_id: int | None = None
    manager_id: int | None = None
    date_of_joining: date | None = None
    employment_type: EmploymentType | None = None
    pan: str | None = Field(default=None, max_length=10)
    aadhaar_last4: str | None = Field(default=None, min_length=4, max_length=4)
    uan: str | None = Field(default=None, max_length=12)
    esic: str | None = Field(default=None, max_length=17)
    bank_ifsc: str | None = Field(default=None, max_length=11)
    is_active: bool | None = None


class EmployeeOut(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str | None
    phone: str | None
    department_id: int | None
    department_name: str | None
    designation_id: int | None
    designation_title: str | None
    manager_id: int | None
    manager_name: str | None
    date_of_joining: date | None
    employment_type: str
    is_active: bool
    has_account: bool
    pan: str | None
    uan: str | None
    created_at: datetime


class EmployeeCreated(EmployeeOut):
    temporary_password: str | None = None
