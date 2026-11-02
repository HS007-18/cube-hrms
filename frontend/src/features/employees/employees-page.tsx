import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { employeesApi } from './api'
import type { Employee, EmployeeCreated } from './types'
import { orgApi } from '@/features/org/api'
import { useDebouncedValue } from '@/lib/hooks'
import { formatDate } from '@/lib/format'

const PAGE_SIZE = 12

interface CreateFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: string
  designationId: string
  managerId: string
  dateOfJoining: string
  employmentType: string
  createAccount: boolean
  role: 'employee' | 'manager' | 'hr_admin'
  password: string
}

function emptyForm(): CreateFormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    managerId: '',
    dateOfJoining: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    employmentType: 'full_time',
    createAccount: false,
    role: 'employee',
    password: '',
  }
}

export function EmployeesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateFormState>(emptyForm)
  const [createdCredential, setCreatedCredential] = useState<{ email: string; password: string } | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim())
  const filters = {
    q: debouncedSearch || undefined,
    department_id: departmentId ? Number(departmentId) : undefined,
    include_inactive: showInactive,
    limit: PAGE_SIZE,
    offset,
  }

  const employees = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeesApi.list(filters),
  })

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments })
  const designations = useQuery({ queryKey: ['designations'], queryFn: orgApi.designations })
  const directory = useQuery({
    queryKey: ['employees', 'directory'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  })

  const create = useMutation({
    mutationFn: () =>
      employeesApi.create({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        department_id: form.departmentId ? Number(form.departmentId) : null,
        designation_id: form.designationId ? Number(form.designationId) : null,
        manager_id: form.managerId ? Number(form.managerId) : null,
        date_of_joining: form.dateOfJoining || undefined,
        employment_type: form.employmentType as 'full_time' | 'part_time' | 'contract' | 'intern',
        create_account: form.createAccount,
        role: form.createAccount ? form.role : undefined,
        password: form.createAccount && form.password ? form.password : undefined,
      }),
    onSuccess: (employee: EmployeeCreated) => {
      toast.push(`${employee.full_name} was added to the directory`)
      setCreateOpen(false)
      setForm(emptyForm())
      setOffset(0)
      queryClient.invalidateQueries()
      if (employee.temporary_password && employee.email) {
        setCreatedCredential({ email: employee.email, password: employee.temporary_password })
      }
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not add the employee', 'error'),
  })

  const resetFilters = () => {
    setSearch('')
    setDepartmentId('')
    setShowInactive(false)
    setOffset(0)
  }

  const canSubmit =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    (!form.createAccount || form.email.trim().length > 0) &&
    (!form.password || form.password.length >= 8)

  const credentialsEmail = createdCredential?.email ?? ''

  const copyCredential = async () => {
    if (!createdCredential) return
    try {
      await navigator.clipboard.writeText(
        `CUBE HRMS\nEmail: ${createdCredential.email}\nTemporary password: ${createdCredential.password}`,
      )
      toast.push('Credentials copied to clipboard')
    } catch {
      toast.push('Clipboard access was blocked by the browser', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="People"
        description="Every employee record, reporting line, and login for this workspace. Changes are tenant-scoped and audited."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            Add employee
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search by name, email, or employee code"
              className="pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setOffset(0)
              }}
              aria-label="Search employees"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filter by department"
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value)
                setOffset(0)
              }}
              className="w-full sm:w-52"
              placeholder="All departments"
            >
              {departments.data?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-text-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => {
                  setShowInactive(event.target.checked)
                  setOffset(0)
                }}
                className="size-3.5 accent-[#12332a]"
              />
              Include inactive
            </label>
            {(search || departmentId || showInactive) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {employees.isLoading ? (
        <PageSkeleton />
      ) : employees.isError ? (
        <ErrorState
          title="Directory unavailable"
          message="The employee list could not be loaded."
          onRetry={() => void employees.refetch()}
        />
      ) : employees.data && employees.data.items.length > 0 ? (
        <>
          <Card className="overflow-hidden">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-on-background/10 bg-surface/40 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Reports to</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-background/10">
                  {employees.data.items.map((employee) => (
                    <EmployeeRow key={employee.id} employee={employee} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-on-background/10 lg:hidden">
              {employees.data.items.map((employee) => (
                <li key={employee.id} className="flex gap-3 p-4">
                  <Avatar name={employee.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-on-background">
                          {employee.full_name}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">
                          {employee.email ?? 'No email on record'}
                        </p>
                      </div>
                      <StatusBadge status={employee.is_active ? 'active' : 'inactive'} />
                    </div>
                    <p className="mt-2 text-[11px] text-text-muted">
                      {employee.employee_code} · {employee.department_name ?? 'No department'} ·{' '}
                      {employee.designation_title ?? 'No designation'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-background/10 bg-white/30 px-5 py-3">
              <p className="text-[11px] text-text-muted">
                Showing {employees.data.offset + 1}–
                {Math.min(employees.data.offset + PAGE_SIZE, employees.data.total)} of{' '}
                {employees.data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= employees.data.total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next
                  <ChevronRight className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title={search || departmentId ? 'No people match those filters' : 'The directory is empty'}
            description={
              search || departmentId
                ? 'Try a broader search, a different department, or include inactive records.'
                : 'Add your first employee to start building the directory and reporting lines.'
            }
            action={
              search || departmentId ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>
                  <UserPlus className="size-4" aria-hidden />
                  Add employee
                </Button>
              )
            }
          />
        </Card>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add an employee"
        description="Create the people record now; a login account is optional and can be issued later."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="employee-create-form" loading={create.isPending} disabled={!canSubmit}>
              Add employee
            </Button>
          </>
        }
      >
        <form
          id="employee-create-form"
          className="space-y-5"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (canSubmit) create.mutate()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" required>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                placeholder="Ananya"
                autoComplete="off"
              />
            </Field>
            <Field label="Last name" htmlFor="lastName" required>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                placeholder="Iyer"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Work email" htmlFor="employeeEmail" hint="Used for the login account and directory.">
              <Input
                id="employeeEmail"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="ananya@company.com"
              />
            </Field>
            <Field label="Phone" htmlFor="employeePhone">
              <Input
                id="employeePhone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" htmlFor="employeeDepartment">
              <Select
                id="employeeDepartment"
                value={form.departmentId}
                onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
                placeholder="Unassigned"
              >
                {departments.data?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Designation" htmlFor="employeeDesignation">
              <Select
                id="employeeDesignation"
                value={form.designationId}
                onChange={(event) => setForm({ ...form, designationId: event.target.value })}
                placeholder="Unassigned"
              >
                {designations.data?.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reporting manager" htmlFor="employeeManager">
              <Select
                id="employeeManager"
                value={form.managerId}
                onChange={(event) => setForm({ ...form, managerId: event.target.value })}
                placeholder="No manager"
              >
                {directory.data?.items.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} · {employee.employee_code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date of joining" htmlFor="employeeJoining">
              <Input
                id="employeeJoining"
                type="date"
                value={form.dateOfJoining}
                onChange={(event) => setForm({ ...form, dateOfJoining: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Employment type" htmlFor="employeeType">
            <Select
              id="employeeType"
              value={form.employmentType}
              onChange={(event) => setForm({ ...form, employmentType: event.target.value })}
            >
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
          </Field>

          <div className="rounded-xl border border-on-background/10 bg-surface/40 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.createAccount}
                onChange={(event) => setForm({ ...form, createAccount: event.target.checked })}
                className="mt-0.5 size-4 accent-[#12332a]"
              />
              <span>
                <span className="block text-[13px] font-semibold text-on-background">
                  Create a login account
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-text-muted">
                  Leave the password blank to generate a temporary one. It is shown once after
                  creation.
                </span>
              </span>
            </label>

            {form.createAccount ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Role" htmlFor="employeeRole">
                  <Select
                    id="employeeRole"
                    value={form.role}
                    onChange={(event) =>
                      setForm({ ...form, role: event.target.value as CreateFormState['role'] })
                    }
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">People manager</option>
                    <option value="hr_admin">HR administrator</option>
                  </Select>
                </Field>
                <Field
                  label="Initial password"
                  htmlFor="employeePassword"
                  hint="Optional. Minimum 8 characters; generated when blank."
                >
                  <Input
                    id="employeePassword"
                    type="text"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Leave blank to generate"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(createdCredential)}
        onClose={() => setCreatedCredential(null)}
        title="Share the login securely"
        description="This temporary password is shown once. Ask the employee to change it after signing in."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreatedCredential(null)}>
              Done
            </Button>
            <Button onClick={() => void copyCredential()}>
              <Copy className="size-3.5" aria-hidden />
              Copy credentials
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-on-background/10 bg-surface p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
              Email
            </p>
            <p className="mt-1 break-all text-[13px] font-semibold text-on-background">
              {credentialsEmail}
            </p>
          </div>
          <div className="rounded-xl border border-gold-200 bg-primary-light/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Temporary password
            </p>
            <p className="numeric mt-1 font-mono text-[15px] font-semibold text-on-background">
              {createdCredential?.password}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function EmployeeRow({ employee }: { employee: Employee }) {
  return (
    <tr className="transition-colors hover:bg-surface">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={employee.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-on-background">{employee.full_name}</p>
            <p className="truncate text-[11px] text-text-muted">
              {employee.email ?? 'No email on record'}
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-text-muted">{employee.employee_code}</td>
      <td className="px-4 py-3.5 text-on-background">{employee.department_name ?? '—'}</td>
      <td className="px-4 py-3.5 text-on-background">{employee.designation_title ?? '—'}</td>
      <td className="px-4 py-3.5 text-on-background">{employee.manager_name ?? '—'}</td>
      <td className="whitespace-nowrap px-4 py-3.5 text-text-muted">{formatDate(employee.date_of_joining)}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={employee.is_active ? 'active' : 'inactive'} />
          {employee.has_account ? <Badge tone="neutral">Login</Badge> : null}
        </div>
      </td>
    </tr>
  )
}
