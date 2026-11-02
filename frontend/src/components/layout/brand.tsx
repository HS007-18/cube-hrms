import { cn } from '@/lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-variant/40 ring-1 ring-secondary-600/35',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-6">
        <path
          d="M16 4 27 10.5v11L16 28 5 21.5v-11L16 4Z"
          fill="none"
          stroke="var(--color-secondary-600)"
          strokeWidth="1.6"
        />
        <path
          d="M16 4v24M5 10.5l22 11M27 10.5l-22 11"
          stroke="var(--color-on-background)"
          strokeOpacity=".24"
          strokeWidth=".9"
        />
      </svg>
    </span>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="font-display text-[1.35rem] font-semibold tracking-[0.02em] text-on-background">
        CUBE
      </span>
      {!compact ? (
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.32em] text-secondary-600/85">
          Human capital
        </span>
      ) : null}
    </span>
  )
}
