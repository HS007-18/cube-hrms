export interface GoalsItem {
  id: number
  name: string
  description: string | null
  goal_type: 'individual' | 'team' | 'company'
  target_value: number
  current_value: number
  unit: string
  start_date: string
  end_date: string
  owner_id: number
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface CreateGoalsPayload {
  name: string
  description?: string
  goal_type: 'individual' | 'team' | 'company'
  target_value: number
  current_value?: number
  unit: string
  start_date: string
  end_date: string
  owner_id: number
}

export interface UpdateGoalsPayload {
  name?: string
  description?: string | null
  goal_type?: 'individual' | 'team' | 'company'
  target_value?: number
  current_value?: number
  unit?: string
  start_date?: string
  end_date?: string
  owner_id?: number
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
}
