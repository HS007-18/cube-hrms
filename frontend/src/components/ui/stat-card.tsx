import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './card'

type Tone = 'pine' | 'gold' | 'sage' | 'clay' | 'purple' | 'cyan'

const tones: Record<Tone, string> = {
  pine: 'bg-[#EBF5FF] text-cube-blue-electric ring-1 ring-cube-blue-electric/20',
  sage: 'bg-[#ECFDF5] text-cube-success ring-1 ring-cube-success/20',
  gold: 'bg-[#FEF3C7] text-amber-600 ring-1 ring-amber-500/20',
  clay: 'bg-[#CFFAFE] text-cyan-600 ring-1 ring-cyan-500/20',
  purple: 'bg-[#EDE9FE] text-cube-purple ring-1 ring-cube-purple/20',
  cyan: 'bg-[#CFFAFE] text-cube-cyan ring-1 ring-cube-cyan/20',
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
    <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:shadow-[0_12px_36px_rgba(7,86,185,0.08)] hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105',
            tones[tone] ?? tones.pine,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-small-label uppercase tracking-wider text-cube-text-muted">
            {label}
          </p>
          <p className="mt-1 text-[32px] font-bold leading-none text-cube-on-background tracking-tight tabular-nums font-sans">
            {value}
          </p>
          {hint ? <p className="mt-1.5 truncate text-[11.5px] text-cube-text-muted">{hint}</p> : null}
        </div>
      </div>
    </Card>
  )
}
