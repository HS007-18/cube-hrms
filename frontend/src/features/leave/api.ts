import { api, queryString } from '@/lib/api'
import type { LeaveBalance, LeaveRequest, LeaveScope, LeaveType } from './types'

export const leaveApi = {
  types: () => api<LeaveType[]>('/leave/types'),
  balances: (year?: number) =>
    api<LeaveBalance[]>(`/leave/balances${queryString({ year })}`),
  requests: (params: { scope: LeaveScope; status?: string }) =>
    api<LeaveRequest[]>(`/leave/requests${queryString(params)}`),
  apply: (payload: {
    leave_type_id: number
    from_date: string
    to_date: string
    reason?: string
  }) => api<LeaveRequest>('/leave/requests', { method: 'POST', body: payload }),
  approve: (requestId: number, comment?: string) =>
    api<LeaveRequest>(`/leave/requests/${requestId}/approve`, {
      method: 'POST',
      body: { comment: comment || null },
    }),
  deny: (requestId: number, comment: string) =>
    api<LeaveRequest>(`/leave/requests/${requestId}/deny`, {
      method: 'POST',
      body: { comment },
    }),
  cancel: (requestId: number) =>
    api<LeaveRequest>(`/leave/requests/${requestId}/cancel`, { method: 'POST' }),
  createType: (payload: {
    name: string
    code: string
    annual_quota_days: number
    is_paid: boolean
    carry_forward: boolean
  }) => api<LeaveType>('/leave/types', { method: 'POST', body: payload }),
}
