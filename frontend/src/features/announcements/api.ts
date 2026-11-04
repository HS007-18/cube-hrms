import { api, queryString } from '@/lib/api'
import type {
  AnnouncementsItem,
  CreateAnnouncementsPayload,
  UpdateAnnouncementsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const announcementsApi = {
  list: (params?: { limit?: number; offset?: number; is_published?: boolean; target_audience?: string }) =>
    api<PaginatedResponse<AnnouncementsItem>>(`/announcements${queryString(params || {})}`),

  create: (payload: CreateAnnouncementsPayload) =>
    api<AnnouncementsItem>('/announcements', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<AnnouncementsItem>(`/announcements/${id}`),

  update: (id: number, payload: UpdateAnnouncementsPayload) =>
    api<AnnouncementsItem>(`/announcements/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/announcements/${id}`, { method: 'DELETE' }),
}
