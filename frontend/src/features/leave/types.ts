export interface LeaveType {
  id: number
  name: string
  code: string
  annual_quota_days: string
  is_paid: boolean
  carry_forward: boolean
  is_active: boolean
}

export interface LeaveBalance {
  leave_type_id: number
  leave_type_name: string
  year: number
  total_days: string
  used_days: string
  remaining_days: string
}

export interface LeaveRequest {
  id: number
  employee_id: number
  employee_name: string
  leave_type_name: string
  from_date: string
  to_date: string
  days: string
  reason: string | null
  status: 'pending' | 'approved' | 'denied' | 'cancelled'
  review_comment: string | null
  created_at: string
}

export type LeaveScope = 'mine' | 'team' | 'all'
