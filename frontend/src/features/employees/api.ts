import { api, queryString } from '@/lib/api'
import type { Page } from '@/lib/types'
import type { Employee, EmployeeCreatePayload, EmployeeCreated } from './types'

export interface EmployeeFilters {
  q?: string
  department_id?: number
  include_inactive?: boolean
  limit?: number
  offset?: number
}

export const employeesApi = {
  list: (filters: EmployeeFilters = {}) =>
    api<Page<Employee>>(`/employees${queryString({ ...filters })}`),
  create: (payload: EmployeeCreatePayload) =>
    api<EmployeeCreated>('/employees', { method: 'POST', body: payload }),
  me: () => api<Employee>('/employees/me'),
}
