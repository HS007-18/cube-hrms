from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class RecruitmentBase(BaseModel):
    title: str
    department_id: int | None = None
    designation_id: int | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    employment_type: str = "full_time"
    min_salary: int | None = None
    max_salary: int | None = None
    openings: int = 1


class RecruitmentCreate(RecruitmentBase):
    pass


class RecruitmentUpdate(BaseModel):
    title: str | None = None
    department_id: int | None = None
    designation_id: int | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    employment_type: str | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    openings: int | None = None
    status: str | None = None


class RecruitmentOut(RecruitmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    status: str
    posted_by: int
    posted_at: datetime
    closed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ApplicationBase(BaseModel):
    recruitment_id: int
    full_name: str
    email: EmailStr
    phone: str | None = None
    resume_url: str | None = None
    cover_letter: str | None = None
    current_company: str | None = None
    current_ctc: int | None = None
    expected_ctc: int | None = None
    notice_period_days: int | None = None
    source: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: str | None = None
    interview_notes: str | None = None
    reviewed_by: int | None = None


class ApplicationOut(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    recruitment_id: int
    status: str
    current_company: str | None = None
    current_ctc: int | None = None
    expected_ctc: int | None = None
    notice_period_days: int | None = None
    source: str | None = None
    reviewed_by: int | None = None
    reviewed_at: datetime | None = None
    interview_notes: str | None = None
    created_at: datetime
    updated_at: datetime


class RecruitmentDetail(RecruitmentOut):
    applications: list[ApplicationOut] = []