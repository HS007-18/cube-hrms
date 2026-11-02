import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className={cn(
        'm-auto w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/60 bg-ivory-50/95 p-0 text-slate-ink shadow-[0_40px_120px_-40px_rgba(12,36,30,.6)] backdrop:bg-pine-950/45 backdrop:backdrop-blur-sm',
        widths[size],
      )}
    >
      <div className="flex items-start justify-between gap-6 border-b border-pine-900/8 px-6 py-5">
        <div>
          <h2 id="dialog-title" className="text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{description}</p>
          ) : null}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
          <X className="size-4" />
        </Button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-pine-900/8 bg-white/35 px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  )
}
