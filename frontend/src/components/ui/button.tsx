import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-cube-blue-electric text-white font-semibold hover:bg-cube-blue-deep active:bg-cube-blue-deep shadow-[0_4px_14px_rgba(8,127,245,0.3)] transition-all duration-150 hover-lift hover:-translate-y-0.5 active:press-scale',
  secondary:
    'border border-[#E2E8F0] bg-white text-[#111D36] font-semibold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] shadow-sm transition-all duration-150 hover-lift hover:-translate-y-0.5 active:press-scale',
  outline:
    'border border-[#CBD5E1] bg-transparent text-[#111D36] font-semibold hover:bg-black/5 transition-all duration-150 hover-lift active:press-scale',
  ghost:
    'bg-transparent text-[#64748B] font-semibold hover:bg-black/5 hover:text-[#111D36] transition-all duration-150 active:press-scale',
  danger:
    'bg-cube-error text-white font-semibold hover:bg-red-700 active:bg-red-800 shadow-sm transition-all duration-150 hover-lift hover:-translate-y-0.5 active:press-scale',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-sans font-semibold text-[14px] leading-none transition-all duration-150 disabled:pointer-events-none disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
