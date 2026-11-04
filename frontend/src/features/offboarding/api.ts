import { api, queryString } from '@/lib/api'
import type {
  OffboardingItem,
  CreateOffboardingPayload,
  UpdateOffboardingPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const offboardingApi = {
  list: (params?: { limit?: number; offset?: number; status?: string }) =>
    api<PaginatedResponse<OffboardingItem>>(`/offboarding${queryString(params || {})}`),

  create: (payload: CreateOffboardingPayload) =>
    api<OffboardingItem>('/offboarding', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<OffboardingItem>(`/offboarding/${id}`),

  update: (id: number, payload: UpdateOffboardingPayload) =>
    api<OffboardingItem>(`/offboarding/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/offboarding/${id}`, { method: 'DELETE' }),
}
