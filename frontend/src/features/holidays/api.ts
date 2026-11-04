import { api, queryString } from '@/lib/api'
import type {
  HolidaysItem,
  CreateHolidaysPayload,
  UpdateHolidaysPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const holidaysApi = {
  list: (params?: { limit?: number; offset?: number; year?: number }) =>
    api<PaginatedResponse<HolidaysItem>>(`/holidays${queryString(params || {})}`),

  create: (payload: CreateHolidaysPayload) =>
    api<HolidaysItem>('/holidays', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<HolidaysItem>(`/holidays/${id}`),

  update: (id: number, payload: UpdateHolidaysPayload) =>
    api<HolidaysItem>(`/holidays/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/holidays/${id}`, { method: 'DELETE' }),
}
