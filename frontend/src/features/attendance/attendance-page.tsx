import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  PencilLine,
  Timer,
  Users,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
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
  currentMonthIST,
  formatDate,
  formatMinutes,
  formatTime,
  monthLabel,
  todayIST,
} from '@/lib/format'
import { attendanceApi } from './api'
import type { AttendanceRecord } from './types'

type View = 'mine' | 'team'

export function AttendancePage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('mine')
  const [month, setMonth] = useState(currentMonthIST())
  const [now, setNow] = useState(() => new Date())
  const [correction, setCorrection] = useState<AttendanceRecord | null>(null)
  const [correctionStatus, setCorrectionStatus] = useState('present')
  const [correctionNotes, setCorrectionNotes] = useState('')

  const isReviewer = user?.role === 'hr_admin' || user?.role === 'manager'
  const canCorrect = user?.role === 'hr_admin'

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const current = useQuery({
    queryKey: ['attendance', 'me', currentMonthIST()],
    queryFn: () => attendanceApi.mine(currentMonthIST()),
  })

  const mine = useQuery({
    queryKey: ['attendance', 'me', month],
    queryFn: () => attendanceApi.mine(month),
  })

  const team = useQuery({
    queryKey: ['attendance', 'team', month],
    queryFn: () => attendanceApi.list({ month }),
    enabled: isReviewer && view === 'team',
  })

  const clockIn = useMutation({
    mutationFn: () => attendanceApi.clockIn(),
    onSuccess: (result) => {
      toast.push(result.message)
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not clock in', 'error'),
  })

  const clockOut = useMutation({
    mutationFn: () => attendanceApi.clockOut(),
    onSuccess: (result) => {
      toast.push(result.message)
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not clock out', 'error'),
  })

  const correct = useMutation({
    mutationFn: () =>
      attendanceApi.correct(correction!.id, {
        status: correctionStatus,
        notes: correctionNotes.trim() || null,
      }),
    onSuccess: () => {
      toast.push('Attendance record updated')
      setCorrection(null)
      queryClient.invalidateQueries()
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not update the record', 'error'),
  })

  if (current.isLoading) return <PageSkeleton />
  if (current.isError) {
    return (
      <ErrorState
        title="Attendance unavailable"
        message="Today’s attendance record could not be loaded."
        onRetry={() => void current.refetch()}
      />
    )
  }

  const today = todayIST()
  const todayRecord = current.data?.find((record) => record.work_date === today)
  const liveMinutes =
    todayRecord?.clock_in && !todayRecord.clock_out
      ? minutesSince(todayRecord.clock_in, now)
      : null
  const mineRecords = mine.data ?? []
  const presentDays = mineRecords.filter((record) =>
    ['present', 'half_day'].includes(record.status),
  ).length
  const liveTodayMinutes =
    month === currentMonthIST() && todayRecord?.clock_in && !todayRecord.clock_out
      ? minutesSince(todayRecord.clock_in, now)
      : 0
  const totalMinutes =
    mineRecords.reduce((total, record) => total + (record.work_minutes ?? 0), 0) +
    liveTodayMinutes
  const teamRecords = team.data ?? []
  const teamPresent = teamRecords.filter(
    (record) => record.work_date === today && record.status === 'present',
  ).length

  const clockTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
    .format(now)
    .toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time & attendance"
        title="Attendance"
        description="Clock in once a day, review your month, and — for HR — correct records with an audit trail."
        actions={
          isReviewer ? (
            <Segmented
              ariaLabel="Attendance view"
              value={view}
              onChange={setView}
              options={[
                { value: 'mine', label: 'My attendance' },
                { value: 'team', label: user?.role === 'hr_admin' ? 'Company' : 'My team' },
              ]}
            />
          ) : undefined
        }
      />

      <Card className="relative overflow-hidden p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-[0_8px_30px_rgb(7,86,185,0.05)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-80 bg-gradient-to-bl from-cube-cyan/15 via-cube-blue-electric/10 to-transparent rounded-full blur-2xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-cube-blue-deep">
              <Clock3 className="size-3.5 text-cube-blue-deep" aria-hidden />
              <span>TODAY · {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-sans text-[clamp(2.5rem,4.5vw,3.5rem)] font-extrabold leading-none text-[#111D36] tracking-tight">
                {clockTime}
              </p>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
                IST
              </span>
            </div>
            <p className="mt-3.5 max-w-md text-[13.5px] leading-relaxed text-[#64748B]">
              {todayRecord?.clock_out
                ? `Your day is closed at ${formatTime(todayRecord.clock_out)} with ${formatMinutes(todayRecord.work_minutes)} recorded.`
                : todayRecord?.clock_in
                  ? `You clocked in at ${formatTime(todayRecord.clock_in)}. The timer has been running for ${formatMinutes(liveMinutes)}.`
                  : 'You have not clocked in today. One record is created per employee per day.'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">
                  Today’s record
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#111D36] tracking-tight">
                  {formatTime(todayRecord?.clock_in)}
                  <span className="mx-2 text-base font-normal text-[#94A3B8]">→</span>
                  {formatTime(todayRecord?.clock_out)}
                </p>
              </div>
              {todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <span className="rounded-full border border-[#CBD5E1] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
                  Not started
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {!todayRecord?.clock_in ? (
                <Button
                  className="flex-1 bg-cube-blue-electric text-white font-semibold hover:bg-cube-blue-deep shadow-[0_4px_14px_rgba(8,127,245,0.3)] h-11 rounded-xl"
                  loading={clockIn.isPending}
                  onClick={() => clockIn.mutate()}
                >
                  <LogIn className="size-4 mr-1.5" aria-hidden />
                  Clock in
                </Button>
              ) : null}
              {todayRecord?.clock_in && !todayRecord?.clock_out ? (
                <Button
                  className="flex-1 bg-white border border-[#CBD5E1] text-[#111D36] font-semibold hover:bg-[#F1F5F9] shadow-sm h-11 rounded-xl"
                  loading={clockOut.isPending}
                  onClick={() => clockOut.mutate()}
                >
                  <LogOut className="size-4 mr-1.5" aria-hidden />
                  Clock out
                </Button>
              ) : null}
              {todayRecord?.clock_out ? (
                <p className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12.5px] font-semibold text-emerald-800">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  Attendance complete for today
                </p>
              ) : null}
            </div>
            {todayRecord?.notes ? (
              <p className="mt-3 text-[11px] leading-relaxed text-[#64748B]">{todayRecord.notes}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {view === 'mine' ? (
            <>
              <MetricPill icon={CalendarDays} label="Present days" value={String(presentDays)} />
              <MetricPill icon={Timer} label="Hours logged" value={formatMinutes(totalMinutes)} />
              <MetricPill icon={Clock3} label="Records" value={String(mineRecords.length)} />
            </>
          ) : (
            <>
              <MetricPill icon={Users} label="Team records" value={String(teamRecords.length)} />
              <MetricPill icon={CheckCircle2} label="Present today" value={String(teamPresent)} />
              <MetricPill icon={CalendarDays} label="Month" value={monthLabel(month)} />
            </>
          )}
        </div>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-text-muted">
          Month
          <Input
            type="month"
            value={month}
            max={currentMonthIST()}
            onChange={(event) => setMonth(event.target.value || currentMonthIST())}
            className="h-9 w-40"
          />
        </label>
      </div>

      {view === 'mine' ? (
        <Card className="overflow-hidden">
          <CardHeader
            className="p-5 pb-0 sm:p-6 sm:pb-0"
            eyebrow={monthLabel(month)}
            title="Your attendance record"
            description="Weekends appear only when a record exists. Holidays join this view in a later release."
          />
          <div className="mt-4">
            {mine.isLoading ? (
              <p className="px-6 py-10 text-center text-[13px] text-text-muted">Loading records…</p>
            ) : mineRecords.length > 0 ? (
              <RecordTable
                records={mineRecords}
                showEmployee={false}
                canCorrect={false}
                onCorrect={(record) => {
                  setCorrection(record)
                  setCorrectionStatus(record.status)
                  setCorrectionNotes(record.notes ?? '')
                }}
              />
            ) : (
              <EmptyState
                icon={Clock3}
                title="No attendance in this month"
                description="Clock in from the card above and your records will appear here."
              />
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            className="p-5 pb-0 sm:p-6 sm:pb-0"
            eyebrow={monthLabel(month)}
            title={user?.role === 'hr_admin' ? 'Company attendance' : 'Team attendance'}
            description={
              canCorrect
                ? 'Correct a status or add a note when the clock does not tell the whole story.'
                : 'Direct reports only. Contact HR if a record needs correction.'
            }
          />
          <div className="mt-4">
            {team.isLoading ? (
              <p className="px-6 py-10 text-center text-[13px] text-text-muted">Loading records…</p>
            ) : team.isError ? (
              <ErrorState
                title="Team attendance unavailable"
                message="The team records could not be loaded."
                onRetry={() => void team.refetch()}
              />
            ) : teamRecords.length > 0 ? (
              <RecordTable
                records={teamRecords}
                showEmployee
                canCorrect={canCorrect}
                onCorrect={(record) => {
                  setCorrection(record)
                  setCorrectionStatus(record.status)
                  setCorrectionNotes(record.notes ?? '')
                }}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No attendance recorded"
                description="Nobody on the team has an attendance record for this month."
              />
            )}
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(correction)}
        onClose={() => setCorrection(null)}
        title="Correct an attendance record"
        description={
          correction
            ? `${correction.employee_name ?? 'Employee'} · ${formatDate(correction.work_date)}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCorrection(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="attendance-correction-form"
              loading={correct.isPending}
            >
              Save correction
            </Button>
          </>
        }
      >
        <form
          id="attendance-correction-form"
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            correct.mutate()
          }}
        >
          <Field label="Status" htmlFor="correctionStatus" required>
            <Select
              id="correctionStatus"
              value={correctionStatus}
              onChange={(event) => setCorrectionStatus(event.target.value)}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half day</option>
              <option value="holiday">Holiday</option>
              <option value="leave">Leave</option>
              <option value="weekend">Weekend</option>
            </Select>
          </Field>
          <Field label="Note" htmlFor="correctionNotes" hint="Visible to the employee and HR.">
            <Textarea
              id="correctionNotes"
              value={correctionNotes}
              onChange={(event) => setCorrectionNotes(event.target.value)}
              placeholder="e.g. Biometric failure — verified with the supervisor."
            />
          </Field>
        </form>
      </Dialog>
    </div>
  )
}

function RecordTable({
  records,
  showEmployee,
  canCorrect,
  onCorrect,
}: {
  records: AttendanceRecord[]
  showEmployee: boolean
  canCorrect: boolean
  onCorrect: (record: AttendanceRecord) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-y border-[#E2E8F0] bg-[#F8FAFC] text-[12.5px] font-semibold uppercase tracking-[0.03em] text-[#64748B]">
            <tr>
              {showEmployee ? <th className="px-5 py-3">Employee</th> : null}
              <th className="px-5 py-3">Date</th>
              <th className="px-4 py-3">Clock in</th>
              <th className="px-4 py-3">Clock out</th>
              <th className="px-4 py-3">Worked</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              {canCorrect ? <th className="px-5 py-3 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-on-background/10">
            {records.map((record) => (
              <tr key={record.id} className="transition-colors hover:bg-surface">
                {showEmployee ? (
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={record.employee_name} size="sm" />
                      <span className="text-[12px] font-semibold text-on-background">
                        {record.employee_name ?? `Employee #${record.employee_id}`}
                      </span>
                    </div>
                  </td>
                ) : null}
                <td className="px-5 py-3 text-on-background tabular-nums">
                  {formatDate(record.work_date, { weekday: 'short' })}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px] tabular-nums text-on-background">
                  {formatTime(record.clock_in)}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px] tabular-nums text-on-background">
                  {formatTime(record.clock_out)}
                </td>
                <td className="px-4 py-3 text-on-background tabular-nums">{formatMinutes(record.work_minutes)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.status} />
                </td>
                <td className="max-w-[14rem] truncate px-4 py-3 text-[11px] text-text-muted">
                  {record.notes ?? '—'}
                </td>
                {canCorrect ? (
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onCorrect(record)}>
                      <PencilLine className="size-3.5" aria-hidden />
                      Correct
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-on-background/10 md:hidden">
        {records.map((record) => (
          <li key={record.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {showEmployee ? (
                  <p className="truncate text-[13px] font-semibold text-on-background">
                    {record.employee_name ?? `Employee #${record.employee_id}`}
                  </p>
                ) : null}
                <p className="text-[12px] font-semibold text-on-background">
                  {formatDate(record.work_date, { weekday: 'short' })}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  {formatTime(record.clock_in)} → {formatTime(record.clock_out)} ·{' '}
                  {formatMinutes(record.work_minutes)}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            {record.notes ? (
              <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{record.notes}</p>
            ) : null}
            {canCorrect ? (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => onCorrect(record)}>
                <PencilLine className="size-3.5" aria-hidden />
                Correct
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  )
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm transition hover:border-[#CBD5E1]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FF] text-cube-blue-electric">
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">{label}</p>
        <p className="text-[14px] font-bold text-[#111D36]">{value}</p>
      </div>
    </div>
  )
}

function minutesSince(clockIn: string, now: Date) {
  const start = new Date(`${todayIST()}T${clockIn}+05:30`)
  if (Number.isNaN(start.getTime())) return 0
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60_000))
}
