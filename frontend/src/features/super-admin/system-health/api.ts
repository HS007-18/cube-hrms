import { api, queryString } from '@/lib/api'
import type {
  SystemHealthItem,
  SystemHealthSummary,
  SystemMetricItem,
  SystemAlertItem,
  CreateSystemAlertPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const systemHealthApi = {
  summary: () =>
    api<SystemHealthSummary>('/system-health/summary'),

  checks: (params?: { check_type?: string; component?: string; status?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<SystemHealthItem>>(`/system-health/checks${queryString(params || {})}`),

  metrics: (params?: { metric_name?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<SystemMetricItem>>(`/system-health/metrics${queryString(params || {})}`),

  alerts: (params?: { is_resolved?: boolean; severity?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<SystemAlertItem>>(`/system-health/alerts${queryString(params || {})}`),

  createAlert: (payload: CreateSystemAlertPayload) =>
    api<SystemAlertItem>('/system-health/alerts', { method: 'POST', body: payload }),

  runChecks: () =>
    api<SystemHealthItem[]>('/system-health/checks/run', { method: 'POST' }),
}
