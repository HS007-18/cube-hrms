export interface AnnouncementsItem {
  id: number
  title: string
  content: string
  target_audience: 'all' | 'hr_admin' | 'managers' | 'employees'
  priority: 'low' | 'normal' | 'high'
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateAnnouncementsPayload {
  title: string
  content: string
  target_audience: 'all' | 'hr_admin' | 'managers' | 'employees'
  priority?: 'low' | 'normal' | 'high'
  is_published?: boolean
  published_at?: string | null
  expires_at?: string | null
}

export interface UpdateAnnouncementsPayload {
  title?: string
  content?: string
  target_audience?: 'all' | 'hr_admin' | 'managers' | 'employees'
  priority?: 'low' | 'normal' | 'high'
  is_published?: boolean
  published_at?: string | null
  expires_at?: string | null
}
