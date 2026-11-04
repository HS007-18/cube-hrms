import { api, queryString } from '@/lib/api'
import type { Report, ReportTemplate, ScheduledReport, CreateReportPayload, CreateTemplatePayload } from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const reportsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api<PaginatedResponse<Report>>(`/reports${queryString(params || {})}`),

  templates: () => api<ReportTemplate[]>('/reports/templates'),

  create: (payload: CreateReportPayload) =>
    api<Report>('/reports', { method: 'POST', body: payload }),

  createTemplate: (payload: CreateTemplatePayload) =>
    api<ReportTemplate>('/reports/templates', { method: 'POST', body: payload }),

  scheduled: () => api<ScheduledReport[]>('/reports/scheduled'),

  download: (reportId: number) => api<Blob>(`/reports/${reportId}/download`, { method: 'GET' }),

  delete: (reportId: number) => api<void>(`/reports/${reportId}`, { method: 'DELETE' }),
}