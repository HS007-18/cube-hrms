import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'pending' | 'danger' | 'neutral' | 'info' | 'cyan'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge: 'border-[#A7F3D0]/60 bg-[#ECFDF5] text-cube-success',
    dot: 'bg-cube-success',
  },
  pending: {
    badge: 'border-[#FDE68A]/60 bg-[#FEF3C7] text-amber-700',
    dot: 'bg-amber-500',
  },
  danger: {
    badge: 'border-[#FECACA]/60 bg-[#FEF2F2] text-cube-error',
    dot: 'bg-cube-error',
  },
  neutral: {
    badge: 'border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B]',
    dot: 'bg-[#94A3B8]',
  },
  info: {
    badge: 'border-[#BAE6FD]/60 bg-[#E0F2FE] text-[#0369A1]',
    dot: 'bg-[#0284C7]',
  },
  cyan: {
    badge: 'border-[#A5F3FC]/60 bg-[#CFFAFE] text-[#0891B2]',
    dot: 'bg-cube-cyan',
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
  const palette = tones[tone] ?? tones.neutral
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[11.5px] font-medium tracking-normal select-none',
        palette.badge,
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full shrink-0', palette.dot)} aria-hidden /> : null}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const tone = statusToTone(status)
  const label = (status ?? 'unknown').replace(/_/g, ' ')
  return (
    <Badge tone={tone} className={cn('capitalize', className)}>
      {label}
    </Badge>
  )
}
