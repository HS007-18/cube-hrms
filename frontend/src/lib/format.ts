export function parseISODate(value?: string | null): Date | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`)
  return new Date(value)
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  const date = parseISODate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDateTime(value?: string | null) {
  const date = parseISODate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatTime(value?: string | null) {
  if (!value) return '—'
  return value.slice(0, 5)
}

export function formatMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function formatDays(value?: string | number | null) {
  if (value === null || value === undefined) return '0'
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return String(value)
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1)
}

export function initials(name?: string | null) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value?: string | null) {
  if (!value) return '—'
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function roleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    hr_admin: 'HR administrator',
    manager: 'People manager',
    employee: 'Employee',
    super_admin: 'Platform administrator',
  }
  return role ? (labels[role] ?? titleCase(role)) : '—'
}

export function currentMonthIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7)
}

export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return month
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  )
}

export function workingDaysBetween(from: string, to: string) {
  if (!from || !to) return 0
  const start = parseISODate(from)
  const end = parseISODate(to)
  if (!start || !end || end < start) return 0
  let days = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const weekday = cursor.getDay()
    if (weekday !== 0 && weekday !== 6) days += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function isoDateWithOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }).format(new Date()),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
