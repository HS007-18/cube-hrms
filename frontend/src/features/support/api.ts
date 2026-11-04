import { api, queryString } from '@/lib/api'
import type {
  SupportItem,
  CreateSupportPayload,
  UpdateSupportPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const supportApi = {
  list: (params?: { limit?: number; offset?: number; status?: string; category?: string }) =>
    api<PaginatedResponse<SupportItem>>(`/support${queryString(params || {})}`),

  create: (payload: CreateSupportPayload) =>
    api<SupportItem>('/support', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<SupportItem>(`/support/${id}`),

  update: (id: number, payload: UpdateSupportPayload) =>
    api<SupportItem>(`/support/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/support/${id}`, { method: 'DELETE' }),
}
