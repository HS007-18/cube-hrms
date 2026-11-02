import { api, queryString } from '@/lib/api'
import type { AttendanceRecord, ClockResult } from './types'

export const attendanceApi = {
  mine: (month: string) =>
    api<AttendanceRecord[]>(`/attendance/me${queryString({ month })}`),
  list: (params: { month: string; employee_id?: number }) =>
    api<AttendanceRecord[]>(`/attendance${queryString(params)}`),
  clockIn: (notes?: string) =>
    api<ClockResult>('/attendance/clock-in', { method: 'POST', body: { notes: notes || null } }),
  clockOut: (notes?: string) =>
    api<ClockResult>('/attendance/clock-out', { method: 'POST', body: { notes: notes || null } }),
  correct: (
    recordId: number,
    payload: {
      status?: string
      clock_in?: string | null
      clock_out?: string | null
      notes?: string | null
    },
  ) => api<AttendanceRecord>(`/attendance/${recordId}`, { method: 'PATCH', body: payload }),
}
