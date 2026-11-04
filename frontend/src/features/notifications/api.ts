import { api, queryString } from '@/lib/api'
import type {
  NotificationsItem,
  CreateNotificationsPayload,
  UpdateNotificationsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const notificationsApi = {
  list: (params?: { limit?: number; offset?: number; is_read?: boolean }) =>
    api<PaginatedResponse<NotificationsItem>>(`/notifications${queryString(params || {})}`),

  create: (payload: CreateNotificationsPayload) =>
    api<NotificationsItem>('/notifications', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<NotificationsItem>(`/notifications/${id}`),

  update: (id: number, payload: UpdateNotificationsPayload) =>
    api<NotificationsItem>(`/notifications/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/notifications/${id}`, { method: 'DELETE' }),

  markAsRead: (id: number) =>
    api<NotificationsItem>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllAsRead: () =>
    api<void>('/notifications/read-all', { method: 'POST' }),
}
