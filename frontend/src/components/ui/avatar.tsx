import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const palettes = [
  'bg-pine-100 text-pine-800',
  'bg-primary-light text-primary',
  'bg-sage-50 text-sage-600',
  'bg-primary-light text-on-background',
  'bg-error-light text-error',
]

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
  xl: 'size-14 text-lg',
}

interface AvatarProps {
  name?: string | null
  size?: keyof typeof sizes
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const hash = Array.from(name ?? '').reduce((total, char) => total + char.charCodeAt(0), 0)
  const palette = palettes[hash % palettes.length]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-white/70',
        palette,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
