import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  Hourglass,
  Palmtree,
  UserCheck,
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

const metricTones: Record<string, 'pine' | 'gold' | 'sage' | 'clay'> = {
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
      <Card className="overflow-hidden border-0 bg-pine-950 p-0 text-ivory-100 shadow-[0_30px_80px_-50px_rgba(12,36,30,.9)]">
        <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow !text-gold-400">
              {formatDate(summary.data.date, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-3 max-w-xl font-display text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.02] text-ivory-50">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ivory-100/55">
              {user?.role === 'hr_admin'
                ? `A calm view of ${user.tenant_name ?? 'your company'} — headcount, attendance, and the approvals waiting on you.`
                : user?.role === 'manager'
                  ? 'Your team, their attendance, and the leave decisions that need a manager’s eye.'
                  : 'Your day at a glance — attendance, leave balance, and where things stand.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="border-white/15 bg-white/8 text-ivory-50 hover:bg-white/14"
              onClick={() => navigate('/attendance')}
            >
              <Clock3 className="size-4" aria-hidden />
              {todayRecord?.clock_in && !todayRecord.clock_out
                ? `On the clock since ${formatTime(todayRecord.clock_in)}`
                : 'Open attendance'}
            </Button>
            <Button
              className="bg-gold-400 text-pine-950 hover:bg-gold-200"
              onClick={() => navigate('/leave')}
            >
              Apply for leave
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 px-6 py-3 text-[11px] text-ivory-100/45 sm:px-8">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-gold-400" aria-hidden />
            {user ? roleLabel(user.role) : 'Workspace'}
          </span>
          <span>{user?.tenant_name ?? 'CUBE platform'}</span>
          <span className="ml-auto hidden sm:block">
            {isReviewer
              ? `${outstanding} request${outstanding === 1 ? '' : 's'} awaiting review`
              : 'Sessions are scoped to your tenant'}
          </span>
        </div>
      </Card>

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

      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card className="p-5 sm:p-6">
          {isReviewer ? (
            <>
              <CardHeader
                eyebrow="Approvals"
                title={user?.role === 'hr_admin' ? 'Leave requests across the company' : 'Your team’s leave requests'}
                description="Approving commits the days against the employee’s balance."
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
                    View all
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                }
              />
              <div className="mt-5">
                {pending.isLoading ? (
                  <p className="py-10 text-center text-[13px] text-slate-muted">Loading requests…</p>
                ) : pending.data && pending.data.length > 0 ? (
                  <ul className="divide-y divide-pine-900/8">
                    {pending.data.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                        <Avatar name={request.employee_name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-pine-900">
                            {request.employee_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-muted">
                            {request.leave_type_name} · {formatDate(request.from_date)} –{' '}
                            {formatDate(request.to_date)} · {formatDays(request.days)} day
                            {Number(request.days) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-[#2f6247]"
                            loading={approve.isPending && approve.variables === request.id}
                            onClick={() => approve.mutate(request.id)}
                          >
                            <Check className="size-3.5" aria-hidden />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-clay-600"
                            onClick={() => {
                              setDenyTarget(request)
                              setDenyComment('')
                            }}
                          >
                            <X className="size-3.5" aria-hidden />
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
                  <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
                    View all
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                }
              />
              <div className="mt-5">
                {myRequests.isLoading ? (
                  <p className="py-10 text-center text-[13px] text-slate-muted">Loading requests…</p>
                ) : myRequests.data && myRequests.data.length > 0 ? (
                  <ul className="divide-y divide-pine-900/8">
                    {myRequests.data.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                          <CalendarDays className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-pine-900">
                            {request.leave_type_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-muted">
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
                    action={<Button onClick={() => navigate('/leave')}>Apply for leave</Button>}
                  />
                )}
              </div>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader eyebrow="Today" title="Attendance" />
            <div className="mt-4 rounded-xl border border-pine-900/8 bg-white/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-muted">
                    {todayRecord?.clock_in ? 'Clocked in' : 'Not clocked in'}
                  </p>
                  <p className="numeric mt-1 text-2xl font-semibold text-pine-950">
                    {formatTime(todayRecord?.clock_in)}
                    <span className="mx-1.5 text-base font-normal text-slate-muted">–</span>
                    {formatTime(todayRecord?.clock_out)}
                  </p>
                </div>
                {todayRecord ? <StatusBadge status={todayRecord.status} /> : <Badge tone="neutral">No record</Badge>}
              </div>
              <p className="mt-2 text-[11px] text-slate-muted">
                {todayRecord?.work_minutes
                  ? `${formatMinutes(todayRecord.work_minutes)} recorded today`
                  : todayRecord?.clock_in
                    ? 'The work timer stops when you clock out.'
                    : 'Clock in from the attendance page to start your day.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => navigate('/attendance')}
            >
              Go to attendance
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          </Card>

          <Card className="p-5">
            <CardHeader
              eyebrow="Balance"
              title="Leave remaining"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
                  Details
                </Button>
              }
            />
            <div className="mt-4 space-y-3.5">
              {balances.isLoading ? (
                <p className="text-[13px] text-slate-muted">Loading balances…</p>
              ) : balances.data && balances.data.length > 0 ? (
                balances.data.slice(0, 4).map((balance) => {
                  const total = Number(balance.total_days) || 0
                  const used = Number(balance.used_days) || 0
                  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
                  return (
                    <div key={balance.leave_type_id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12px] font-semibold text-pine-900">
                          {balance.leave_type_name}
                        </p>
                        <p className="numeric shrink-0 text-[12px] text-slate-muted">
                          <span className="font-semibold text-pine-900">
                            {formatDays(balance.remaining_days)}
                          </span>{' '}
                          / {formatDays(balance.total_days)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-pine-900/8">
                        <div
                          className="h-full rounded-full bg-gold-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-[13px] text-slate-muted">No leave types configured yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

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
