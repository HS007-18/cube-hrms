import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'pending' | 'danger' | 'neutral' | 'info'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge: 'border-cube-secondary-light/50 bg-cube-secondary-light text-cube-secondary',
    dot: 'bg-cube-secondary',
  },
  pending: {
    badge: 'border-cube-primary-light/50 bg-cube-primary-light text-cube-primary',
    dot: 'bg-cube-primary',
  },
  danger: {
    badge: 'border-cube-error-light/50 bg-cube-error-light text-cube-error',
    dot: 'bg-cube-error',
  },
  neutral: {
    badge: 'border-cube-border bg-cube-surface-hover text-cube-on-background',
    dot: 'bg-cube-text-muted',
  },
  info: {
    badge: 'border-cube-secondary-light/50 bg-cube-secondary-light text-cube-secondary',
    dot: 'bg-cube-secondary',
  },
}

const statusTone: Record<string, BadgeTone> = {
  present: 'success',
  approved: 'success',
  active: 'success',
  pending: 'pending',
  half_day: 'pending',
  leave: 'info',
  weekend: 'neutral',
  holiday: 'info',
  absent: 'danger',
  denied: 'danger',
  cancelled: 'danger',
  suspended: 'danger',
}

function statusToTone(status?: string | null): BadgeTone {
  if (!status) return 'neutral'
  return statusTone[status] ?? 'neutral'
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}

export function Badge({ children, tone = 'neutral', dot = true, className }: BadgeProps) {
  const palette = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize transition-colors',
        palette.badge,
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full', palette.dot)} aria-hidden /> : null}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusToTone(status)}>{status.replaceAll('_', ' ')}</Badge>
}
