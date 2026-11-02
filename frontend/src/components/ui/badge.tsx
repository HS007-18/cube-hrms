import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'pending' | 'danger' | 'neutral' | 'info'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge: 'border-secondary-light/50 bg-secondary-light text-secondary',
    dot: 'bg-secondary',
  },
  pending: {
    badge: 'border-primary-light/50 bg-primary-light text-primary',
    dot: 'bg-primary',
  },
  danger: {
    badge: 'border-error-light/50 bg-error-light text-error',
    dot: 'bg-error',
  },
  neutral: {
    badge: 'border-on-background/10 bg-surface-hover text-on-background',
    dot: 'bg-text-muted',
  },
  info: {
    badge: 'border-secondary-light/50 bg-secondary-light text-secondary',
    dot: 'bg-secondary',
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
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
