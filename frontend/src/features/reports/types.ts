export interface Report {
  id: number
  name: string
  description: string | null
  type: string
  generated_at: string
  generated_by: number
  file_url: string | null
  status: 'generating' | 'completed' | 'failed'
}

export interface ReportTemplate {
  id: number
  name: string
  description: string | null
  query: string
  parameters: Record<string, unknown>
  is_scheduled: boolean
  schedule_cron: string | null
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area'
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  colors?: string[]
}

export interface ScheduledReport {
  id: number
  template_id: number
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  last_run: string | null
  next_run: string
  is_active: boolean
}

export interface CreateReportPayload {
  template_id: number
  parameters: Record<string, unknown>
  format: 'pdf' | 'excel' | 'csv'
}

export interface CreateTemplatePayload {
  name: string
  description?: string
  query: string
  parameters: Record<string, unknown>
  is_scheduled?: boolean
  schedule_cron?: string
}