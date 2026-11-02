export interface AttendanceRecord {
  id: number
  employee_id: number
  employee_name: string | null
  work_date: string
  clock_in: string | null
  clock_out: string | null
  status: string
  work_minutes: number | null
  notes: string | null
  source: string
}

export interface ClockResult {
  record: AttendanceRecord
  message: string
}
