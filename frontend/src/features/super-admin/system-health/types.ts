export interface SystemHealthItem {
  id: number
  check_type: string
  component: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  message: string | null
  metadata: Record<string, unknown> | null
  checked_at: string
  created_at: string
}

export interface SystemHealthSummary {
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
  total_checks: number
  healthy_count: number
  degraded_count: number
  unhealthy_count: number
  last_checked: string
}

export interface SystemMetricItem {
  id: number
  metric_name: string
  value: number
  unit: string
  tags: Record<string, string>
  recorded_at: string
}

export interface SystemAlertItem {
  id: number
  check_type: string
  component: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export interface CreateSystemAlertPayload {
  check_type: string
  component: string
  severity: 'info' | 'warning' | 'critical'
  message: string
}
