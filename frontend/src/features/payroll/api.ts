import { api, queryString } from '@/lib/api'
import type {
  Payroll,
  PayrollDetail,
  PayrollItem,
  CreatePayrollPayload,
  UpdatePayrollPayload,
  CreatePayrollItemPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const payrollApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api<PaginatedResponse<Payroll>>(`/payroll${queryString(params || {})}`),

  create: (payload: CreatePayrollPayload) =>
    api<Payroll>('/payroll', { method: 'POST', body: payload }),

  get: (payrollId: number) => api<PayrollDetail>(`/payroll/${payrollId}`),

  update: (payrollId: number, payload: UpdatePayrollPayload) =>
    api<Payroll>(`/payroll/${payrollId}`, { method: 'PATCH', body: payload }),

  addItem: (payrollId: number, payload: CreatePayrollItemPayload) =>
    api<PayrollItem>(`/payroll/${payrollId}/items`, { method: 'POST', body: payload }),

  process: (payrollId: number) =>
    api<Payroll>(`/payroll/${payrollId}/process`, { method: 'POST', body: { payroll_id: payrollId } }),
}