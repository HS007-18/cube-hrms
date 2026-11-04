export interface SupportItem {
  id: number
  title: string
  description: string
  category: 'technical' | 'hr' | 'payroll' | 'benefits' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  requester_id: number
  assignee_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateSupportPayload {
  title: string
  description: string
  category: 'technical' | 'hr' | 'payroll' | 'benefits' | 'general'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface UpdateSupportPayload {
  title?: string
  description?: string
  category?: 'technical' | 'hr' | 'payroll' | 'benefits' | 'general'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignee_id?: number | null
}
