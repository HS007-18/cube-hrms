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
        'inline-flex flex-wrap items-center gap-1 rounded-2xl border border-[#E2E8F0] bg-white p-1 shadow-sm',
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
              'rounded-xl px-3.5 py-1.5 font-sans text-[13px] font-semibold transition-all duration-150',
              active
                ? 'bg-cube-blue-electric text-white shadow-[0_2px_8px_rgba(8,127,245,0.25)]'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#111D36]',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
