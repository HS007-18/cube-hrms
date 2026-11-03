import { cn } from '@/lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex size-10 shrink-0 items-center justify-center', className)} aria-hidden>
      <img
        src="/cubeai-icon.png"
        alt="CubeAI"
        className="size-9 object-contain drop-shadow-[0_0_12px_rgba(8,217,245,0.35)]"
      />
    </div>
  )
}

export function BrandLogo({
  variant = 'dark',
  className,
}: {
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <img
        src={variant === 'dark' ? '/cubeai-logo-dark.png' : '/cubeai-logo.png'}
        alt="CubeAI Solutions"
        className="h-10 w-auto object-contain"
      />
    </div>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col leading-none">
      <div className="flex items-baseline gap-1">
        <span className="font-sans text-[1.25rem] font-extrabold tracking-tight text-white">
          CubeAI
        </span>
        <span className="font-sans text-[1.1rem] font-bold tracking-tight text-cube-cyan">
          Solutions
        </span>
      </div>
      {!compact ? (
        <span className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.24em] text-slate-400">
          Human Capital
        </span>
      ) : null}
    </div>
  )
}
