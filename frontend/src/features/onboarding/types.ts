export interface OnboardingTask {
  id: number
  tenant_id: number
  onboarding_id: number
  title: string
  description: string | null
  type: string
  assigned_to: number | null
  due_date: string | null
  display_order: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Onboarding {
  id: number
  tenant_id: number
  employee_id: number
  assigned_to: number | null
  start_date: string
  expected_completion_date: string | null
  actual_completion_date: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingDetail extends Onboarding {
  tasks: OnboardingTask[]
}

export interface CreateOnboardingPayload {
  employee_id: number
  assigned_to?: number
  start_date: string
  expected_completion_date?: string
  notes?: string
  tasks: CreateOnboardingTaskPayload[]
}

export interface UpdateOnboardingPayload {
  assigned_to?: number | null
  start_date?: string
  expected_completion_date?: string
  actual_completion_date?: string | null
  status?: string
  notes?: string | null
}

export interface CreateOnboardingTaskPayload {
  onboarding_id: number
  title: string
  description?: string
  type: string
  assigned_to?: number
  due_date?: string
  display_order?: number
}

export interface UpdateOnboardingTaskPayload {
  title?: string
  description?: string | null
  type?: string
  assigned_to?: number | null
  due_date?: string | null
  status?: string
  display_order?: number
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'