import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'pending' | 'danger' | 'neutral' | 'info'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge: 'border-secondary-600/20 bg-secondary-600/10 text-secondary-600',
    dot: 'bg-secondary-600',
  },
  pending: {
    badge: 'border-primary-600/20 bg-primary-600/10 text-primary-600',
    dot: 'bg-primary-600',
  },
  danger: {
    badge: 'border-error-600/20 bg-error-600/10 text-error-600',
    dot: 'bg-error-600',
  },
  neutral: {
    badge: 'border-on-surface/10 bg-on-surface/5 text-on-background',
    dot: 'bg-on-background/70',
  },
  info: {
    badge: 'border-secondary-variant/20 bg-secondary-variant/10 text-secondary-variant',
    dot: 'bg-secondary-variant',
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
