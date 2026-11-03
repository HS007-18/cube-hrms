import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Futuristic Illustrated Container with Sparkle Rays */}
      <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#EBF5FF] text-cube-blue-electric shadow-[0_4px_20px_rgba(8,127,245,0.12)] ring-1 ring-cube-blue-electric/20">
        <Icon className="size-8" aria-hidden />
        {/* Subtle decorative futuristic accents */}
        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-cube-cyan animate-pulse" />
        <span className="absolute -bottom-1 -left-1 size-1.5 rounded-full bg-cube-blue-electric" />
      </div>
      <h3 className="font-sans text-[16px] font-semibold text-[#111D36]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-[#64748B]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
