export interface NotificationsItem {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  recipient_id: number | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateNotificationsPayload {
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  recipient_id?: number
}

export interface UpdateNotificationsPayload {
  title?: string
  message?: string
  type?: 'info' | 'warning' | 'success' | 'error'
  recipient_id?: number | null
  is_read?: boolean
}
