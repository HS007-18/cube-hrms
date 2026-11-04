import { api, queryString } from '@/lib/api'
import type {
  PlatformAuditItem,
  CreatePlatformAuditPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const platformAuditApi = {
  list: (params?: { limit?: number; offset?: number; tenant_id?: number; action?: string }) =>
    api<PaginatedResponse<PlatformAuditItem>>(`/platform-audit${queryString(params || {})}`),

  get: (id: number) =>
    api<PlatformAuditItem>(`/platform-audit/${id}`),

  create: (payload: CreatePlatformAuditPayload) =>
    api<PlatformAuditItem>('/platform-audit', { method: 'POST', body: payload }),
}
