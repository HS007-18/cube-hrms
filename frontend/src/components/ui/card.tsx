import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgb(7,86,185,0.04)] transition-all duration-200',
        className,
      )}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  eyebrow?: string
  className?: string
}

export function CardHeader({ title, description, action, eyebrow, className }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-small-label uppercase tracking-wider text-cube-blue-deep">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="text-card-heading text-cube-on-background">{title}</h3>
        {description ? (
          <p className="mt-1 text-[13.5px] leading-relaxed text-cube-text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
