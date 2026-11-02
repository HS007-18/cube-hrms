import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/skeleton'
import { employeesApi } from '@/features/employees/api'
import type { Employee } from '@/features/employees/types'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatDate, roleLabel, titleCase } from '@/lib/format'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const employee = useQuery<Employee, ApiError>({
    queryKey: ['employees', 'me'],
    queryFn: employeesApi.me,
    enabled: Boolean(user && !user.is_platform_admin),
    retry: false,
  })

  if (!user) return null
  if (employee.isLoading && !user.is_platform_admin) return <PageSkeleton />

  const missingProfile = employee.error instanceof ApiError && employee.error.status === 404
  const record = employee.data

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Your account, role, and employee record. Contact HR if something here needs correcting."
        actions={
          <Button variant="secondary" onClick={() => void logout()}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.full_name} size="xl" />
            <h2 className="mt-4 font-display text-2xl text-pine-950">{user.full_name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-muted">
              <Mail className="size-3.5" aria-hidden />
              {user.email}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge tone={user.is_platform_admin ? 'pending' : 'info'} dot={false}>
                <BadgeCheck className="size-3" aria-hidden />
                {roleLabel(user.role)}
              </Badge>
              <Badge tone="neutral" dot={false}>
                {user.tenant_name ?? 'CUBE platform'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-pine-900/8 pt-5">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-2 text-slate-muted">
                <Building2 className="size-3.5" aria-hidden />
                Workspace
              </span>
              <span className="font-semibold text-pine-900">
                {user.tenant_name ?? 'Platform console'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-2 text-slate-muted">
                <UserRound className="size-3.5" aria-hidden />
                Employee ID
              </span>
              <span className="font-mono text-[11px] font-semibold text-pine-900">
                {record?.employee_code ?? user.employee_id ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-2 text-slate-muted">
                <CalendarDays className="size-3.5" aria-hidden />
                Joined
              </span>
              <span className="font-semibold text-pine-900">
                {record ? formatDate(record.date_of_joining) : '—'}
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {user.is_platform_admin ? (
            <Card className="p-6">
              <CardHeader
                eyebrow="Platform access"
                title="CUBE administrator"
                description="This account sits above tenant row-level security and is limited to tenant administration."
              />
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-100/50 p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
                <p className="text-[12px] leading-relaxed text-gold-600">
                  Platform administrators cannot open tenant HR endpoints such as the employee
                  directory, attendance, or leave. Those actions belong to the tenant’s own HR team.
                </p>
              </div>
            </Card>
          ) : missingProfile ? (
            <Card className="p-6">
              <CardHeader
                eyebrow="Employee record"
                title="No employee record linked"
                description="Your login works, but there is no people record attached to it yet."
              />
              <p className="mt-4 rounded-xl border border-pine-900/8 bg-white/45 px-3.5 py-3 text-[12px] leading-relaxed text-slate-muted">
                Ask an HR administrator to add you to the directory or link your account. Leave
                balances and attendance need an employee record.
              </p>
            </Card>
          ) : record ? (
            <>
              <Card className="p-6">
                <CardHeader
                  eyebrow="Employment"
                  title="Role & reporting"
                  description="Maintained by your HR team."
                />
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="Department" value={record.department_name ?? 'Unassigned'} />
                  <Detail label="Designation" value={record.designation_title ?? 'Unassigned'} />
                  <Detail label="Reports to" value={record.manager_name ?? 'No manager'} />
                  <Detail label="Employment type" value={titleCase(record.employment_type)} />
                  <Detail
                    label="Work email"
                    value={record.email ?? user.email}
                  />
                  <Detail
                    label="Phone"
                    value={record.phone ?? 'Not on record'}
                    icon={<Phone className="size-3.5" aria-hidden />}
                  />
                </dl>
              </Card>

              <Card className="p-6">
                <CardHeader
                  eyebrow="Statutory"
                  title="Payroll identifiers"
                  description="Used by payroll and statutory exports in a later release. Visible to you and HR."
                />
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="PAN" value={record.pan ?? 'Not on record'} mono />
                  <Detail label="UAN" value={record.uan ?? 'Not on record'} mono />
                </dl>
              </Card>
            </>
          ) : employee.isError ? (
            <ErrorState
              title="Employee record unavailable"
              message="Your people record could not be loaded."
              onRetry={() => void employee.refetch()}
            />
          ) : null}

          <Card className="p-6">
            <CardHeader
              eyebrow="Security"
              title="Session & access"
              description="Access tokens last 30 minutes and refresh securely in the background."
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pine-900/8 bg-white/45 px-3.5 py-3">
              <div>
                <p className="text-[12px] font-semibold text-pine-900">Active session</p>
                <p className="mt-0.5 text-[11px] text-slate-muted">
                  Signing out revokes every refresh token issued to this account.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                <LogOut className="size-3.5" aria-hidden />
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  mono = false,
  icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: ReactNode
}) {
  return (
    <div className="border-b border-pine-900/6 pb-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-muted">{label}</dt>
      <dd
        className={`mt-1 flex items-center gap-1.5 text-[13px] font-medium text-pine-900 ${
          mono ? 'font-mono text-[12px]' : ''
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  )
}
