export interface TenantAnalyticsItem {
  id: number
  tenant_id: number
  tenant_name: string
  total_users: number
  total_employees: number
  storage_used_mb: number
  api_calls_24h: number
  last_activity: string | null
  created_at: string
  updated_at: string
}

export interface CreateTenantAnalyticsPayload {
  tenant_id: number
}

export interface UpdateTenantAnalyticsPayload {
  tenant_id?: number
}
