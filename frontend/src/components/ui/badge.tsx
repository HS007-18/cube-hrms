import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'pending' | 'danger' | 'neutral' | 'info'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge: 'border-[#cfe0d3] bg-[#e9f1ea] text-[#2f6247]',
    dot: 'bg-[#3d7a5b]',
  },
  pending: {
    badge: 'border-gold-200 bg-gold-100 text-gold-600',
    dot: 'bg-gold-500',
  },
  danger: {
    badge: 'border-[#ecd2cb] bg-clay-50 text-clay-600',
    dot: 'bg-clay-600',
  },
  neutral: {
    badge: 'border-pine-900/10 bg-pine-900/5 text-slate-muted',
    dot: 'bg-slate-muted/70',
  },
  info: {
    badge: 'border-[#d5e0e2] bg-[#eaf0f1] text-[#3d5c63]',
    dot: 'bg-[#547b84]',
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
