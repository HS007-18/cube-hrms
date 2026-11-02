import { cn } from '@/lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-cube-primary-light ring-1 ring-cube-primary/10',
        className,
      )}
      aria-hidden
    >
      <img src="/cube-icon.webp" alt="CUBE" className="size-6" />
    </span>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="font-display text-[1.35rem] font-semibold tracking-[0.02em] text-cube-on-background">
        CUBE
      </span>
      {!compact ? (
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.32em] text-cube-primary-light">
          Human capital
        </span>
      ) : null}
    </span>
  )
}
