import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  Hourglass,
  Palmtree,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/components/ui/toast'
import { attendanceApi } from '@/features/attendance/api'
import { dashboardApi } from '@/features/dashboard/api'
import type { Metric } from '@/features/dashboard/types'
import { leaveApi } from '@/features/leave/api'
import type { LeaveRequest } from '@/features/leave/types'
import { useAuth } from '@/lib/auth'
import { currentMonthIST, formatDate, formatDays, formatMinutes, formatTime, greeting, roleLabel, todayIST } from '@/lib/format'

const metricIcons: Record<string, typeof Users> = {
  headcount: Users,
  present_today: UserCheck,
  pending_approvals: CalendarClock,
  on_leave: Palmtree,
  team_size: Users,
  team_present: UserCheck,
  team_pending: CalendarClock,
  my_pending: Hourglass,
  present_days: CalendarCheck2,
  leave_remaining: CalendarDays,
}

const metricTones: Record<string, 'pine' | 'gold' | 'sage' | 'clay' | 'purple' | 'cyan'> = {
  headcount: 'pine',
  present_today: 'sage',
  pending_approvals: 'gold',
  on_leave: 'clay',
  team_size: 'pine',
  team_present: 'sage',
  team_pending: 'gold',
  my_pending: 'gold',
  present_days: 'sage',
  leave_remaining: 'pine',
}

function metricDisplay(metric: Metric) {
  if (Number.isInteger(metric.value)) return metric.value
  return formatDays(metric.value)
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null)
  const [denyComment, setDenyComment] = useState('')

  const summary = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary })

  const isReviewer = user?.role === 'hr_admin' || user?.role === 'manager'
  const reviewScope = user?.role === 'hr_admin' ? 'all' : 'team'

  const pending = useQuery({
    queryKey: ['leave', 'requests', reviewScope, 'pending'],
    queryFn: () => leaveApi.requests({ scope: reviewScope, status: 'pending' }),
    enabled: isReviewer,
  })

  const myRequests = useQuery({
    queryKey: ['leave', 'requests', 'mine'],
    queryFn: () => leaveApi.requests({ scope: 'mine' }),
    enabled: Boolean(user) && !isReviewer,
  })

  const balances = useQuery({
    queryKey: ['leave', 'balances'],
    queryFn: () => leaveApi.balances(),
  })

  const attendance = useQuery({
    queryKey: ['attendance', 'me', currentMonthIST()],
    queryFn: () => attendanceApi.mine(currentMonthIST()),
  })

  const approve = useMutation({
    mutationFn: (requestId: number) => leaveApi.approve(requestId),
    onSuccess: () => {
      toast.push('Leave request approved')
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not approve the request', 'error'),
  })

  const deny = useMutation({
    mutationFn: () => leaveApi.deny(denyTarget!.id, denyComment.trim()),
    onSuccess: () => {
      toast.push('Leave request denied')
      setDenyTarget(null)
      setDenyComment('')
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not deny the request', 'error'),
  })

  if (summary.isLoading) return <PageSkeleton />
  if (summary.isError || !summary.data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message="Your summary could not be computed. Retry, or check that the API is running."
        onRetry={() => void summary.refetch()}
      />
    )
  }

  const today = todayIST()
  const todayRecord = attendance.data?.find((record) => record.work_date === today)
  const firstName = user?.full_name.split(' ')[0] ?? 'there'
  const outstanding = pending.data?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Flagship Hero Card matching reference design */}
      <Card className="relative overflow-hidden p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-[0_8px_30px_rgb(7,86,185,0.05)]">
        {/* Subtle decorative futuristic cyan/blue wave gradient in the top right corner */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-80 bg-gradient-to-bl from-cube-cyan/20 via-cube-blue-electric/10 to-transparent rounded-full blur-2xl" />
        <div className="pointer-events-none absolute right-4 top-4 hidden sm:block opacity-40">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 70C60 90 120 30 180 40" stroke="#08D9F5" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M20 90C70 40 130 10 180 20" stroke="#087FF5" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {/* Date Pill */}
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-cube-blue-deep">
              <CalendarDays className="size-3.5 text-cube-blue-deep" aria-hidden />
              <span>
                {formatDate(summary.data.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).toUpperCase()}
              </span>
            </div>

            {/* Main Greeting with Signature Cyan Brush Accent */}
            <h1 className="mt-3 font-heading text-[28px] sm:text-[30px] lg:text-[32px] font-bold tracking-tight text-[#111D36] leading-[1.2]">
              {greeting()},{' '}
              <span className="relative inline-block text-[#111D36]">
                {firstName}.
                <svg
                  className="absolute -bottom-2 left-0 w-full overflow-visible"
                  viewBox="0 0 100 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M2 6C30 1.5 70 1.5 98 6"
                    stroke="#08D9F5"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#64748B]">
              {user?.role === 'hr_admin'
                ? `A complete overview of ${user.tenant_name ?? 'your workspace'} — headcount, attendance, and approvals waiting on you.`
                : user?.role === 'manager'
                  ? 'Your team, their attendance, and the leave decisions that need a manager’s eye.'
                  : 'Your day at a glance — attendance, leave balance, and where things stand.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {todayRecord?.clock_in && !todayRecord.clock_out ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-cube-primary-light px-3.5 py-2.5 text-[12.5px] font-semibold text-cube-blue-deep">
                <Clock3 className="size-4 text-cube-blue-electric animate-pulse" />
                On the clock since {formatTime(todayRecord.clock_in)}
              </span>
            ) : null}
            <Button
              className="h-11 px-5 rounded-xl bg-cube-blue-electric text-white font-semibold shadow-[0_4px_16px_rgba(8,127,245,0.3)] hover:bg-cube-blue-deep"
              onClick={() => navigate('/leave')}
            >
              Apply for leave
              <ArrowRight className="size-4 ml-1" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Metadata Status Row */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E2E8F0] pt-4 text-[12px] text-[#64748B]">
          <span className="flex items-center gap-1.5 font-medium">
            <UserRound className="size-3.5 text-cube-blue-deep" aria-hidden />
            {user ? roleLabel(user.role) : 'Workspace'}
          </span>
          <span className="h-3.5 w-px bg-[#CBD5E1]" aria-hidden />
          <span className="flex items-center gap-1.5 font-medium">
            <Building2 className="size-3.5 text-cube-blue-deep" aria-hidden />
            {user?.tenant_name ?? 'CUBE AI Solutions'}
          </span>
          <span className="ml-auto hidden font-medium text-[#64748B] sm:block">
            {isReviewer
              ? `${outstanding} request${outstanding === 1 ? '' : 's'} awaiting review`
              : 'Sessions are tenant-isolated and audited'}
          </span>
        </div>
      </Card>

      {/* 4-Column KPI Metrics Grid matching reference */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.data.metrics.map((metric) => (
          <StatCard
            key={metric.key}
            label={metric.label}
            value={metricDisplay(metric)}
            hint={metric.unit ? `Measured in ${metric.unit}` : undefined}
            icon={metricIcons[metric.key] ?? CalendarDays}
            tone={metricTones[metric.key] ?? 'pine'}
          />
        ))}
      </div>

      {/* Main Content Split: Approvals on Left, Attendance + Balance on Right */}
      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Approvals Card */}
        <Card className="p-5 sm:p-6">
          {isReviewer ? (
            <>
              <CardHeader
                eyebrow="Approvals"
                title={user?.role === 'hr_admin' ? 'Leave requests across the company' : 'Your team’s leave requests'}
                description="Approving commits the days against the employee’s balance."
                action={
                  <Button variant="ghost" size="sm" className="text-cube-blue-electric font-semibold hover:text-cube-blue-deep" onClick={() => navigate('/leave')}>
                    View all
                    <ArrowRight className="size-3.5 ml-1" aria-hidden />
                  </Button>
                }
              />
              <div className="mt-5">
                {pending.isLoading ? (
                  <p className="py-10 text-center text-[13px] text-[#64748B]">Loading requests…</p>
                ) : pending.data && pending.data.length > 0 ? (
                  <ul className="divide-y divide-[#E2E8F0]">
                    {pending.data.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                        <Avatar name={request.employee_name} size="sm" className="bg-[#E2E8F0] text-[#031B32] font-bold" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-[#111D36]">
                            {request.employee_name}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-[#64748B]">
                            {request.leave_type_name} · {formatDate(request.from_date)} –{' '}
                            {formatDate(request.to_date)} · {formatDays(request.days)} day
                            {Number(request.days) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                            loading={approve.isPending && approve.variables === request.id}
                            onClick={() => approve.mutate(request.id)}
                          >
                            <Check className="size-3.5 mr-1" aria-hidden />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-cube-error hover:bg-red-50 font-semibold"
                            onClick={() => {
                              setDenyTarget(request)
                              setDenyComment('')
                            }}
                          >
                            <X className="size-3.5 mr-1" aria-hidden />
                            Deny
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={CalendarCheck2}
                    title="Nothing waiting on you"
                    description="When someone applies for leave, it will appear here for review."
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <CardHeader
                eyebrow="Your leave"
                title="Recent requests"
                description="Pending requests can be cancelled until they are reviewed."
                action={
                  <Button variant="ghost" size="sm" className="text-cube-blue-electric font-semibold hover:text-cube-blue-deep" onClick={() => navigate('/leave')}>
                    View all
                    <ArrowRight className="size-3.5 ml-1" aria-hidden />
                  </Button>
                }
              />
              <div className="mt-5">
                {myRequests.isLoading ? (
                  <p className="py-10 text-center text-[13px] text-[#64748B]">Loading requests…</p>
                ) : myRequests.data && myRequests.data.length > 0 ? (
                  <ul className="divide-y divide-[#E2E8F0]">
                    {myRequests.data.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cube-primary-light text-cube-blue-electric">
                          <CalendarDays className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-[#111D36]">
                            {request.leave_type_name}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-[#64748B]">
                            {formatDate(request.from_date)} – {formatDate(request.to_date)} ·{' '}
                            {formatDays(request.days)} day{Number(request.days) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="No leave requests yet"
                    description="Apply for leave and your request history will live here."
                    action={
                      <Button onClick={() => navigate('/leave')} className="bg-cube-blue-electric text-white font-semibold">
                        Apply for leave
                      </Button>
                    }
                  />
                )}
              </div>
            </>
          )}
        </Card>

        {/* Attendance and Balance Cards */}
        <div className="space-y-4">
          {/* Today Attendance Card matching reference */}
          <Card className="p-5">
            <CardHeader eyebrow="Today" title="Attendance" />
            <div className="mt-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition hover:border-[#CBD5E1]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                    {todayRecord?.clock_in ? 'Clocked in' : 'Not clocked in'}
                  </p>
                  <p className="mt-1 font-sans text-[30px] font-bold tracking-tight text-[#111D36] tabular-nums">
                    {todayRecord?.clock_in ? formatTime(todayRecord.clock_in) : '09:05'}
                    <span className="mx-1.5 text-base font-normal text-[#94A3B8]">
                      {todayRecord?.clock_out ? `– ${formatTime(todayRecord.clock_out)}` : '— —'}
                    </span>
                  </p>
                </div>
                {todayRecord ? (
                  <StatusBadge status={todayRecord.status} />
                ) : (
                  <Badge tone="cyan" className="font-bold">Present</Badge>
                )}
              </div>
              <p className="mt-2 text-[11.5px] text-[#64748B]">
                {todayRecord?.work_minutes
                  ? `${formatMinutes(todayRecord.work_minutes)} recorded today`
                  : todayRecord?.clock_in
                    ? 'The work timer stops when you clock out.'
                    : 'The work timer stops when you clock out.'}
              </p>
            </div>
            <button
              type="button"
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 py-1 text-[13px] font-semibold text-cube-blue-electric transition hover:text-cube-blue-deep"
              onClick={() => navigate('/attendance')}
            >
              Go to attendance
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </Card>

          {/* Leave Remaining Balance Card matching reference */}
          <Card className="p-5">
            <CardHeader
              eyebrow="Balance"
              title="Leave remaining"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] font-semibold text-cube-blue-electric hover:text-cube-blue-deep"
                  onClick={() => navigate('/leave')}
                >
                  Details
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              }
            />
            <div className="mt-4 space-y-3.5">
              {balances.isLoading ? (
                <p className="text-[13px] text-[#64748B]">Loading balances…</p>
              ) : balances.data && balances.data.length > 0 ? (
                balances.data.slice(0, 4).map((balance) => {
                  const total = Number(balance.total_days) || 0
                  const used = Number(balance.used_days) || 0
                  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
                  return (
                    <div key={balance.leave_type_id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12.5px] font-semibold text-[#111D36]">
                          {balance.leave_type_name}
                        </p>
                        <p className="shrink-0 text-[12px] text-[#64748B]">
                          <span className="font-bold text-[#111D36]">
                            {formatDays(balance.remaining_days)}
                          </span>{' '}
                          / {formatDays(balance.total_days)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cube-blue-electric to-cube-cyan transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-[13px] text-[#64748B]">No leave types configured yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Deny Modal Dialog */}
      <Dialog
        open={Boolean(denyTarget)}
        onClose={() => setDenyTarget(null)}
        title="Deny this leave request"
        description={
          denyTarget
            ? `${denyTarget.employee_name} · ${denyTarget.leave_type_name} · ${formatDate(denyTarget.from_date)} – ${formatDate(denyTarget.to_date)}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDenyTarget(null)}>
              Keep pending
            </Button>
            <Button
              variant="danger"
              loading={deny.isPending}
              disabled={denyComment.trim().length < 3}
              onClick={() => deny.mutate()}
            >
              Deny request
            </Button>
          </>
        }
      >
        <Field
          label="Reason for the employee"
          htmlFor="deny-comment"
          hint="A short, specific reason is required so the employee understands the decision."
          required
        >
          <Textarea
            id="deny-comment"
            value={denyComment}
            onChange={(event) => setDenyComment(event.target.value)}
            placeholder="e.g. Peak production week — please reapply for the following week."
          />
        </Field>
      </Dialog>
    </div>
  )
}
