export interface OffboardingItem {
  id: number
  employee_id: number
  employee_name: string
  exit_type: 'resignation' | 'termination' | 'retirement' | 'contract_end'
  exit_date: string
  reason: string | null
  status: 'initiated' | 'in_progress' | 'completed' | 'cancelled'
  exit_interview_date: string | null
  exit_interview_notes: string | null
  assets_returned: boolean
  assets_returned_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateOffboardingPayload {
  employee_id: number
  exit_type: 'resignation' | 'termination' | 'retirement' | 'contract_end'
  exit_date: string
  reason?: string
}

export interface UpdateOffboardingPayload {
  employee_id?: number
  exit_type?: 'resignation' | 'termination' | 'retirement' | 'contract_end'
  exit_date?: string
  reason?: string | null
  status?: 'initiated' | 'in_progress' | 'completed' | 'cancelled'
  exit_interview_date?: string | null
  exit_interview_notes?: string | null
  assets_returned?: boolean
  assets_returned_date?: string | null
}
