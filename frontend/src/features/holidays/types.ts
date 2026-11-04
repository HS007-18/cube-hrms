export interface HolidaysItem {
  id: number
  name: string
  date: string
  type: 'national' | 'regional' | 'company' | 'religious'
  is_recurring: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreateHolidaysPayload {
  name: string
  date: string
  type: 'national' | 'regional' | 'company' | 'religious'
  is_recurring?: boolean
  description?: string
}

export interface UpdateHolidaysPayload {
  name?: string
  date?: string
  type?: 'national' | 'regional' | 'company' | 'religious'
  is_recurring?: boolean
  description?: string | null
}
