export interface Department {
  id: number
  name: string
  code: string | null
  parent_id: number | null
}

export interface Designation {
  id: number
  title: string
  level: number
}
