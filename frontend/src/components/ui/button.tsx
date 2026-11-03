import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--cube-primary)] text-[var(--cube-on-primary)] hover:bg-[var(--cube-primary-hover)] active:bg-[var(--cube-primary-hover)] shadow-soft transition-all duration-150 hover-lift hover-lift:hover press-scale:active',
  secondary:
    'bg-[var(--cube-secondary)] text-[var(--cube-on-secondary)] hover:bg-[var(--cube-secondary-hover)] active:bg-[var(--cube-secondary-hover)] shadow-soft transition-all duration-150 hover-lift hover-lift:hover press-scale:active',
  outline:
    'border border-[var(--cube-border)] bg-transparent text-[var(--cube-on-background)] hover:bg-[var(--cube-surface-hover)] active:bg-[var(--cube-surface-hover)] shadow-soft transition-all duration-150 hover-lift hover-lift:hover press-scale:active',
  ghost:
    'bg-transparent text-[var(--cube-text-muted)] hover:bg-[var(--cube-surface-hover)] hover:text-[var(--cube-on-background)] shadow-soft transition-all duration-150 hover-lift hover-lift:hover press-scale:active',
  danger:
    'bg-[var(--cube-error)] text-[var(--cube-on-error)] hover:bg-[var(--cube-error)]/90 active:bg-[var(--cube-error)]/90 transition-all duration-150 hover-lift hover-lift:hover press-scale:active',
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
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-55',
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
