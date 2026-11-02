import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Check,
  ClipboardList,
  Plus,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import {
  formatDate,
  formatDays,
  isoDateWithOffset,
  todayIST,
  workingDaysBetween,
} from '@/lib/format'
import { leaveApi } from './api'
import type { LeaveRequest } from './types'

type Tab = 'mine' | 'approvals' | 'policies'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function LeavePage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('mine')
  const [statusFilter, setStatusFilter] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [fromDate, setFromDate] = useState(isoDateWithOffset(1))
  const [toDate, setToDate] = useState(isoDateWithOffset(1))
  const [reason, setReason] = useState('')
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null)
  const [denyComment, setDenyComment] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [typeCode, setTypeCode] = useState('')
  const [typeQuota, setTypeQuota] = useState('12')
  const [typePaid, setTypePaid] = useState(true)
  const [typeCarryForward, setTypeCarryForward] = useState(false)

  const isReviewer = user?.role === 'hr_admin' || user?.role === 'manager'
  const isHr = user?.role === 'hr_admin'
  const reviewScope = isHr ? 'all' : 'team'

  const balances = useQuery({ queryKey: ['leave', 'balances'], queryFn: () => leaveApi.balances() })
  const types = useQuery({ queryKey: ['leave', 'types'], queryFn: leaveApi.types })
  const myRequests = useQuery({
    queryKey: ['leave', 'requests', 'mine'],
    queryFn: () => leaveApi.requests({ scope: 'mine' }),
  })
  const approvals = useQuery({
    queryKey: ['leave', 'requests', reviewScope, statusFilter],
    queryFn: () =>
      leaveApi.requests({
        scope: reviewScope,
        status: statusFilter || undefined,
      }),
    enabled: isReviewer && tab === 'approvals',
  })

  const selectedType = types.data?.find((type) => type.id === Number(leaveTypeId))
  const selectedBalance = balances.data?.find(
    (balance) => balance.leave_type_id === Number(leaveTypeId),
  )
  const requestedDays = workingDaysBetween(fromDate, toDate)

  const apply = useMutation({
    mutationFn: () =>
      leaveApi.apply({
        leave_type_id: Number(leaveTypeId),
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (request) => {
      toast.push(`${request.leave_type_name} request submitted`)
      setApplyOpen(false)
      setReason('')
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not submit the request', 'error'),
  })

  const cancel = useMutation({
    mutationFn: (requestId: number) => leaveApi.cancel(requestId),
    onSuccess: () => {
      toast.push('Leave request cancelled')
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not cancel the request', 'error'),
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

  const createType = useMutation({
    mutationFn: () =>
      leaveApi.createType({
        name: typeName.trim(),
        code: typeCode.trim(),
        annual_quota_days: Number(typeQuota) || 0,
        is_paid: typePaid,
        carry_forward: typeCarryForward,
      }),
    onSuccess: () => {
      toast.push('Leave type created')
      setTypeOpen(false)
      setTypeName('')
      setTypeCode('')
      setTypeQuota('12')
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not create the leave type', 'error'),
  })

  if (balances.isLoading || types.isLoading) return <PageSkeleton />

  const tabs: { value: Tab; label: string }[] = [
    { value: 'mine', label: 'My leave' },
    ...(isReviewer ? [{ value: 'approvals' as Tab, label: 'Approvals' }] : []),
    ...(isHr ? [{ value: 'policies' as Tab, label: 'Policies' }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave & time off"
        title="Leave"
        description={
          isReviewer
            ? 'Balances, applications, and the approvals that keep the team’s time off fair and recorded.'
            : 'Your balances, applications, and the status of every request you have made.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented ariaLabel="Leave sections" value={tab} onChange={setTab} options={tabs} />
            <Button onClick={() => setApplyOpen(true)}>
              <CalendarPlus className="size-4" aria-hidden />
              Apply for leave
            </Button>
          </div>
        }
      />

      {tab === 'mine' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {balances.isError ? (
              <ErrorState
                title="Balances unavailable"
                message="Leave balances could not be loaded."
                onRetry={() => void balances.refetch()}
              />
            ) : balances.data && balances.data.length > 0 ? (
              balances.data.map((balance) => {
                const total = Number(balance.total_days) || 0
                const used = Number(balance.used_days) || 0
                const remaining = Number(balance.remaining_days) || 0
                const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
                return (
                  <Card key={balance.leave_type_id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-muted">
                          {balance.leave_type_name}
                        </p>
                        <p className="numeric mt-2 text-3xl font-semibold leading-none text-pine-950">
                          {formatDays(remaining)}
                          <span className="ml-1 text-[12px] font-medium text-slate-muted">left</span>
                        </p>
                      </div>
                      <span className="flex size-9 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                        <CalendarDays className="size-4" aria-hidden />
                      </span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pine-900/8">
                      <div className="h-full rounded-full bg-gold-400" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-muted">
                      {formatDays(used)} used of {formatDays(total)} days in {balance.year}
                    </p>
                  </Card>
                )
              })
            ) : (
              <Card className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  icon={CalendarDays}
                  title="No leave types configured"
                  description="An HR administrator needs to define leave types before requests can be made."
                />
              </Card>
            )}
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              className="p-5 pb-0 sm:p-6 sm:pb-0"
              eyebrow="History"
              title="My requests"
              description="Pending requests can be cancelled. Approved leave is refunded when cancelled."
            />
            <div className="mt-4">
              {myRequests.isLoading ? (
                <p className="px-6 py-10 text-center text-[13px] text-slate-muted">Loading requests…</p>
              ) : myRequests.isError ? (
                <ErrorState
                  title="Requests unavailable"
                  message="Your leave requests could not be loaded."
                  onRetry={() => void myRequests.refetch()}
                />
              ) : myRequests.data && myRequests.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-[13px]">
                    <thead className="border-y border-pine-900/8 bg-white/40 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-muted">
                      <tr>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3">Days</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine-900/6">
                      {myRequests.data.map((request) => (
                        <tr key={request.id} className="transition-colors hover:bg-white/45">
                          <td className="whitespace-nowrap px-5 py-3 font-semibold text-pine-900">
                            {request.leave_type_name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-ink">
                            {formatDate(request.from_date)} – {formatDate(request.to_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-ink">{formatDays(request.days)}</td>
                          <td className="max-w-[16rem] truncate px-4 py-3 text-slate-muted">
                            {request.reason ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            {request.status === 'pending' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-clay-600"
                                loading={cancel.isPending && cancel.variables === request.id}
                                onClick={() => cancel.mutate(request.id)}
                              >
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-muted">
                                {request.review_comment ?? '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck2}
                  title="No requests yet"
                  description="Apply for leave and the full history will be kept here."
                  action={
                    <Button onClick={() => setApplyOpen(true)}>
                      <CalendarPlus className="size-4" aria-hidden />
                      Apply for leave
                    </Button>
                  }
                />
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'approvals' ? (
        <Card className="overflow-hidden">
          <CardHeader
            className="p-5 sm:p-6"
            eyebrow={isHr ? 'Company-wide' : 'Your team'}
            title="Leave approvals"
            description={
              isHr
                ? 'Approve or deny requests across the company. Approval commits the days to the employee’s balance.'
                : 'You can review requests from your direct reports only.'
            }
            action={
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-44"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            }
          />
          <div className="mt-4">
            {approvals.isLoading ? (
              <p className="px-6 py-10 text-center text-[13px] text-slate-muted">Loading approvals…</p>
            ) : approvals.isError ? (
              <ErrorState
                title="Approvals unavailable"
                message="The approval queue could not be loaded."
                onRetry={() => void approvals.refetch()}
              />
            ) : approvals.data && approvals.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead className="border-y border-pine-900/8 bg-white/40 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-muted">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pine-900/6">
                    {approvals.data.map((request) => (
                      <tr key={request.id} className="transition-colors hover:bg-white/45">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={request.employee_name} size="sm" />
                            <span className="whitespace-nowrap text-[12px] font-semibold text-pine-900">
                              {request.employee_name}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">{request.leave_type_name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">
                          {formatDate(request.from_date)} – {formatDate(request.to_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">{formatDays(request.days)}</td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-slate-muted">
                          {request.reason ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-5 py-3">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
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
                          ) : (
                            <p className="max-w-[12rem] truncate text-right text-[11px] text-slate-muted">
                              {request.review_comment ?? '—'}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title={statusFilter ? 'No requests with this status' : 'No approvals waiting'}
                description={
                  statusFilter
                    ? 'Try a different status filter.'
                    : 'New leave requests will appear here for review.'
                }
              />
            )}
          </div>
        </Card>
      ) : null}

      {tab === 'policies' ? (
        <Card className="overflow-hidden">
          <CardHeader
            className="p-5 sm:p-6"
            eyebrow="Policy"
            title="Leave types"
            description="Quotas are annual. Changing a quota affects new balances, not days already used."
            action={
              <Button variant="secondary" onClick={() => setTypeOpen(true)}>
                <Plus className="size-4" aria-hidden />
                New leave type
              </Button>
            }
          />
          <div className="mt-4">
            {types.data && types.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-[13px]">
                  <thead className="border-y border-pine-900/8 bg-white/40 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-muted">
                    <tr>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Annual quota</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Carry forward</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pine-900/6">
                    {types.data.map((type) => (
                      <tr key={type.id} className="transition-colors hover:bg-white/45">
                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-pine-900">{type.name}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-muted">
                          {type.code}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">
                          {formatDays(type.annual_quota_days)} days
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">{type.is_paid ? 'Yes' : 'No'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-ink">
                          {type.carry_forward ? 'Yes' : 'No'}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={type.is_active ? 'success' : 'neutral'}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No leave types"
                description="Define casual, sick, and earned leave to start accepting requests."
                action={<Button onClick={() => setTypeOpen(true)}>New leave type</Button>}
              />
            )}
          </div>
        </Card>
      ) : null}

      <Dialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply for leave"
        description="Weekends are excluded automatically. Dates must fall within one calendar year."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="leave-apply-form"
              loading={apply.isPending}
              disabled={!leaveTypeId || requestedDays === 0}
            >
              Submit request
            </Button>
          </>
        }
      >
        <form
          id="leave-apply-form"
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (leaveTypeId && requestedDays > 0) apply.mutate()
          }}
        >
          <Field
            label="Leave type"
            htmlFor="leaveType"
            required
            hint={
              selectedType && selectedBalance
                ? `${formatDays(selectedBalance.remaining_days)} of ${formatDays(selectedBalance.total_days)} days remaining in ${selectedBalance.year}`
                : selectedType
                  ? `${formatDays(selectedType.annual_quota_days)} days per year`
                  : undefined
            }
          >
            <Select
              id="leaveType"
              value={leaveTypeId}
              onChange={(event) => setLeaveTypeId(event.target.value)}
              placeholder="Choose a leave type"
            >
              {types.data?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="fromDate" required>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                min={`${todayIST().slice(0, 4)}-01-01`}
                max={`${todayIST().slice(0, 4)}-12-31`}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </Field>
            <Field label="To" htmlFor="toDate" required>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                min={fromDate}
                max={`${todayIST().slice(0, 4)}-12-31`}
                onChange={(event) => setToDate(event.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-pine-900/8 bg-white/45 px-3.5 py-2.5">
            <p className="text-[11px] text-slate-muted">
              <span className="font-semibold text-pine-900">
                {requestedDays} working day{requestedDays === 1 ? '' : 's'}
              </span>{' '}
              selected. {leaveTypeId ? 'This will be deducted on approval.' : 'Choose a leave type to continue.'}
            </p>
          </div>

          <Field label="Reason" htmlFor="leaveReason" hint="Optional, but helpful for your manager.">
            <Textarea
              id="leaveReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Family function out of town."
            />
          </Field>
        </form>
      </Dialog>

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
          htmlFor="leaveDenyComment"
          hint="Required. The employee will see this on the request."
          required
        >
          <Textarea
            id="leaveDenyComment"
            value={denyComment}
            onChange={(event) => setDenyComment(event.target.value)}
            placeholder="e.g. Team is short-staffed that week — please reapply after the 15th."
          />
        </Field>
      </Dialog>

      <Dialog
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        title="New leave type"
        description="Codes are permanent and used by exports and payroll integrations."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTypeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="leave-type-form"
              loading={createType.isPending}
              disabled={typeName.trim().length < 2 || !/^[a-z0-9_-]{2,30}$/.test(typeCode)}
            >
              Create leave type
            </Button>
          </>
        }
      >
        <form
          id="leave-type-form"
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            createType.mutate()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="leaveTypeName" required>
              <Input
                id="leaveTypeName"
                value={typeName}
                onChange={(event) => {
                  setTypeName(event.target.value)
                  setTypeCode(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                      .slice(0, 30),
                  )
                }}
                placeholder="Earned Leave"
              />
            </Field>
            <Field
              label="Code"
              htmlFor="leaveTypeCode"
              required
              hint="Lowercase letters, numbers, hyphen, or underscore."
            >
              <Input
                id="leaveTypeCode"
                value={typeCode}
                onChange={(event) => setTypeCode(event.target.value.toLowerCase())}
                placeholder="earned"
                maxLength={30}
              />
            </Field>
          </div>
          <Field label="Annual quota (days)" htmlFor="leaveTypeQuota" required>
            <Input
              id="leaveTypeQuota"
              type="number"
              min={0}
              max={366}
              step={0.5}
              value={typeQuota}
              onChange={(event) => setTypeQuota(event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-pine-900/8 bg-white/40 p-3">
              <input
                type="checkbox"
                checked={typePaid}
                onChange={(event) => setTypePaid(event.target.checked)}
                className="mt-0.5 size-4 accent-[#12332a]"
              />
              <span>
                <span className="block text-[12px] font-semibold text-pine-900">Paid leave</span>
                <span className="block text-[10px] text-slate-muted">Counts as paid time off.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-pine-900/8 bg-white/40 p-3">
              <input
                type="checkbox"
                checked={typeCarryForward}
                onChange={(event) => setTypeCarryForward(event.target.checked)}
                className="mt-0.5 size-4 accent-[#12332a]"
              />
              <span>
                <span className="block text-[12px] font-semibold text-pine-900">Carry forward</span>
                <span className="block text-[10px] text-slate-muted">Unused days roll to next year.</span>
              </span>
            </label>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
