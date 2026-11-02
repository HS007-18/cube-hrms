import { api } from '@/lib/api'
import type { Department, Designation } from './types'

export const orgApi = {
  departments: () => api<Department[]>('/departments'),
  designations: () => api<Designation[]>('/designations'),
  createDepartment: (payload: { name: string; code?: string }) =>
    api<Department>('/departments', { method: 'POST', body: payload }),
  createDesignation: (payload: { title: string; level?: number }) =>
    api<Designation>('/designations', { method: 'POST', body: payload }),
}
