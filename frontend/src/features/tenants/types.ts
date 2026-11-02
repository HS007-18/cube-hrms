export interface Tenant {
  id: number
  name: string
  slug: string
  status: 'pending' | 'active' | 'suspended' | 'cancelled'
  plan: 'free' | 'basic' | 'scale' | 'enterprise'
  contact_email: string | null
  domain: string | null
  created_at: string
  employee_count: number
}

export interface TenantDetail extends Tenant {
  owner_name: string | null
  owner_email: string | null
  pending_leave_requests: number
}

export interface CreateTenantResult {
  tenant: Tenant
  owner_email: string
  temporary_password: string
}
