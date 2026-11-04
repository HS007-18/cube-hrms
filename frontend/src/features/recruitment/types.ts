export interface Recruitment {
  id: number
  tenant_id: number
  title: string
  department_id: number | null
  designation_id: number | null
  description: string | null
  requirements: string | null
  location: string | null
  employment_type: string
  min_salary: number | null
  max_salary: number | null
  openings: number
  status: 'open' | 'closed' | 'on_hold' | 'cancelled'
  posted_by: number
  posted_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface RecruitmentDetail extends Recruitment {
  applications: Application[]
}

export interface Application {
  id: number
  tenant_id: number
  recruitment_id: number
  full_name: string
  email: string
  phone: string | null
  resume_url: string | null
  cover_letter: string | null
  current_company: string | null
  current_ctc: number | null
  expected_ctc: number | null
  notice_period_days: number | null
  source: string | null
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  reviewed_by: number | null
  reviewed_at: string | null
  interview_notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateRecruitmentPayload {
  title: string
  department_id?: number
  designation_id?: number
  description?: string
  requirements?: string
  location?: string
  employment_type?: string
  min_salary?: number
  max_salary?: number
  openings?: number
}

export interface UpdateRecruitmentPayload {
  title?: string
  department_id?: number | null
  designation_id?: number | null
  description?: string
  requirements?: string
  location?: string
  employment_type?: string
  min_salary?: number | null
  max_salary?: number | null
  openings?: number
  status?: string
}

export interface CreateApplicationPayload {
  recruitment_id: number
  full_name: string
  email: string
  phone?: string
  resume_url?: string
  cover_letter?: string
  current_company?: string
  current_ctc?: number
  expected_ctc?: number
  notice_period_days?: number
  source?: string
}

export interface UpdateApplicationPayload {
  status?: string
  interview_notes?: string
  reviewed_by?: number | null
}

export type RecruitmentStatus = 'open' | 'closed' | 'on_hold' | 'cancelled'
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'