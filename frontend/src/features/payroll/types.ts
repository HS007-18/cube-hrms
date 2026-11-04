export interface PayrollItem {
  id: number
  tenant_id: number
  payroll_id: number
  employee_id: number
  name: string
  type: 'earning' | 'deduction'
  amount: string
  is_taxable: boolean
  display_order: number
  created_at: string
}

export interface Payroll {
  id: number
  tenant_id: number
  period_start: string
  period_end: string
  status: 'draft' | 'processing' | 'completed' | 'cancelled'
  notes: string | null
  processed_by: number | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface PayrollDetail extends Payroll {
  items: PayrollItem[]
}

export interface CreatePayrollPayload {
  period_start: string
  period_end: string
  notes?: string
}

export interface UpdatePayrollPayload {
  period_start?: string
  period_end?: string
  status?: string
  notes?: string
}

export interface CreatePayrollItemPayload {
  employee_id: number
  name: string
  type: 'earning' | 'deduction'
  amount: string
  is_taxable?: boolean
  display_order?: number
}