import { cn } from '@/lib/cn'

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  className?: string
  ariaLabel: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl border border-on-background/10 bg-surface p-1',
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
              active
                ? 'bg-on-background text-on-background shadow-sm'
                : 'text-text-muted hover:bg-surface hover:text-on-background',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
