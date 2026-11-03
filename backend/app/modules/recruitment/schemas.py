from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, EmailStr


class RecruitmentBase(BaseModel):
    title: str
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: str = "full_time"
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    openings: int = 1


class RecruitmentCreate(RecruitmentBase):
    pass


class RecruitmentUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    openings: Optional[int] = None
    status: Optional[str] = None


class RecruitmentOut(RecruitmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    posted_by: int
    posted_at: str
    closed_at: Optional[str] = None
    created_at: str
    updated_at: str


class ApplicationBase(BaseModel):
    recruitment_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    current_company: Optional[str] = None
    current_ctc: Optional[int] = None
    expected_ctc: Optional[int] = None
    notice_period_days: Optional[int] = None
    source: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    interview_notes: Optional[str] = None
    reviewed_by: Optional[int] = None


class ApplicationOut(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    recruitment_id: int
    status: str
    current_company: Optional[str] = None
    current_ctc: Optional[int] = None
    expected_ctc: Optional[int] = None
    notice_period_days: Optional[int] = None
    source: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[str] = None
    interview_notes: Optional[str] = None
    created_at: str
    updated_at: str


class RecruitmentDetail(RecruitmentOut):
    applications: List[ApplicationOut] = []