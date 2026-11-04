import { api, queryString } from '@/lib/api'
import type {
  SubscriptionsItem,
  CreateSubscriptionsPayload,
  UpdateSubscriptionsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const subscriptionsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api<PaginatedResponse<SubscriptionsItem>>(`/subscriptions${queryString(params || {})}`),

  create: (payload: CreateSubscriptionsPayload) =>
    api<SubscriptionsItem>('/subscriptions', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<SubscriptionsItem>(`/subscriptions/${id}`),

  update: (id: number, payload: UpdateSubscriptionsPayload) =>
    api<SubscriptionsItem>(`/subscriptions/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/subscriptions/${id}`, { method: 'DELETE' }),
}
