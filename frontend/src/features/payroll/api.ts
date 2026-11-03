import { api } from '@/lib/api';

export interface PayrollItem {
  id: number;
  tenant_id: number;
  payroll_id: number;
  employee_id: number;
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
  is_taxable: boolean;
  display_order: number;
}

export interface Payroll {
  id: number;
  tenant_id: number;
  period_start: string;
  period_end: string;
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  processed_by: number | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PayrollItem[];
}

export interface PayrollCreate {
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface PayrollUpdate {
  period_start?: string;
  period_end?: string;
  status?: 'draft' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
}

export interface PayrollItemCreate {
  employee_id: number;
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
  is_taxable?: boolean;
  display_order?: number;
}

export interface PayrollProcessRequest {
  payroll_id: number;
}

export async function listPayrolls(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  return api<{ items: Payroll[]; total: number; limit: number; offset: number }>(`/payroll?${search}`);
}

export async function createPayroll(payload: PayrollCreate) {
  return api<Payroll>('/payroll', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getPayroll(payrollId: number) {
  return api<Payroll>(`/payroll/${payrollId}`);
}

export async function updatePayroll(payrollId: number, payload: PayrollUpdate) {
  return api<Payroll>(`/payroll/${payrollId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function addPayrollItem(payrollId: number, payload: PayrollItemCreate) {
  return api<PayrollItem>(`/payroll/${payrollId}/items`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function processPayroll(payrollId: number) {
  return api<Payroll>(`/payroll/${payrollId}/process`, { method: 'POST', body: JSON.stringify({ payroll_id: payrollId }) });
}