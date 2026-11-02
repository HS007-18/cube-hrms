export interface Metric {
  key: string
  label: string
  value: number
  unit: string | null
}

export interface DashboardSummary {
  role: string
  date: string
  metrics: Metric[]
}
