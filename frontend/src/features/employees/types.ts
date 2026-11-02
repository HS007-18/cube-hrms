export interface Employee {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  department_id: number | null
  department_name: string | null
  designation_id: number | null
  designation_title: string | null
  manager_id: number | null
  manager_name: string | null
  date_of_joining: string | null
  employment_type: string
  is_active: boolean
  has_account: boolean
  pan: string | null
  uan: string | null
  created_at: string
}

export interface EmployeeCreated extends Employee {
  temporary_password: string | null
}

export interface EmployeeCreatePayload {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  employee_code?: string
  department_id?: number | null
  designation_id?: number | null
  manager_id?: number | null
  date_of_joining?: string
  employment_type?: string
  create_account?: boolean
  role?: 'employee' | 'manager' | 'hr_admin'
  password?: string
}
