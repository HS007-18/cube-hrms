import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'glass-strong text-on-primary hover:bg-primary-light active:bg-primary-light shadow-soft transition-all duration-150',
  secondary:
    'glass text-on-secondary hover:bg-secondary-light active:bg-secondary-light shadow-soft transition-all duration-150',
  outline:
    'border border-on-background/10 bg-transparent text-on-background hover:bg-surface-hover active:bg-surface-hover shadow-soft transition-all duration-150',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-hover active:bg-surface-hover shadow-soft transition-all duration-150',
  danger:
    'bg-error text-on-error shadow-[0_10px_24px_-16px_rgba(220,38,38,0.3)] hover:bg-error/90 active:bg-error/90 transition-all duration-150',
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
