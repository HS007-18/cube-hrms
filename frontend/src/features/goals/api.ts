import { api, queryString } from '@/lib/api'
import type {
  GoalsItem,
  CreateGoalsPayload,
  UpdateGoalsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const goalsApi = {
  list: (params?: { limit?: number; offset?: number; status?: string }) =>
    api<PaginatedResponse<GoalsItem>>(`/goals${queryString(params || {})}`),

  create: (payload: CreateGoalsPayload) =>
    api<GoalsItem>('/goals', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<GoalsItem>(`/goals/${id}`),

  update: (id: number, payload: UpdateGoalsPayload) =>
    api<GoalsItem>(`/goals/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/goals/${id}`, { method: 'DELETE' }),
}
