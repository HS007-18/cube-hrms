import { api, queryString } from '@/lib/api'
import type { Page } from '@/lib/types'
import type { CreateTenantResult, Tenant, TenantDetail } from './types'

export interface TenantCreatePayload {
  name: string
  slug: string
  plan: 'free' | 'basic' | 'scale' | 'enterprise'
  contact_email: string
  owner_name: string
  owner_email: string
}

export const tenantsApi = {
  list: (params: { q?: string; status?: string; limit?: number; offset?: number } = {}) =>
    api<Page<Tenant>>(`/tenants${queryString({ ...params })}`),
  detail: (tenantId: number) => api<TenantDetail>(`/tenants/${tenantId}`),
  create: (payload: TenantCreatePayload) =>
    api<CreateTenantResult>('/tenants', { method: 'POST', body: payload }),
  provision: (tenantId: number) =>
    api<{ tenant: Tenant }>(`/tenants/${tenantId}/provision`, { method: 'POST' }),
  setStatus: (tenantId: number, status: Tenant['status']) =>
    api<Tenant>(`/tenants/${tenantId}/status`, { method: 'PATCH', body: { status } }),
}
