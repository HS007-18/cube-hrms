import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './card'

type Tone = 'pine' | 'gold' | 'sage' | 'clay'

const tones: Record<Tone, string> = {
  pine: 'bg-pine-100/80 text-pine-800',
  gold: 'bg-primary-light text-primary',
  sage: 'bg-sage-50 text-sage-600',
  clay: 'bg-error-light text-error',
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  tone?: Tone
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'pine' }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
            {label}
          </p>
          <p className="numeric mt-2 text-[1.9rem] font-semibold leading-none text-on-background">
            {value}
          </p>
          {hint ? <p className="mt-2 text-[12px] leading-snug text-text-muted">{hint}</p> : null}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/60',
            tones[tone],
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
    </Card>
  )
}
