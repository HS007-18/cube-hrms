import { api, queryString } from '@/lib/api'
import type {
  TenantAnalyticsItem,
  CreateTenantAnalyticsPayload,
  UpdateTenantAnalyticsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const tenantAnalyticsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api<PaginatedResponse<TenantAnalyticsItem>>(`/reports/tenant-analytics${queryString(params || {})}`),

  get: (id: number) =>
    api<TenantAnalyticsItem>(`/reports/tenant-analytics/${id}`),

  refresh: (tenantId: number) =>
    api<TenantAnalyticsItem>(`/reports/tenant-analytics/${tenantId}/refresh`, { method: 'POST' }),
}
