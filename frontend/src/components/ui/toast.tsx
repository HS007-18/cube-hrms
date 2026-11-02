import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastApi {
  push: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const tones: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-[#2f6247]' },
  error: { icon: AlertTriangle, className: 'text-error' },
  info: { icon: Info, className: 'text-text-muted' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = ++nextId.current
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      const timer = window.setTimeout(() => dismiss(id), 4500)
      timers.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const pendingTimers = timers.current
    return () => {
      pendingTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const api = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = tones[toast.tone]
          return (
            <div
              key={toast.id}
              className="glass pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-on-background shadow-lg"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', className)} aria-hidden />
              <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
              <button
                type="button"
                className="rounded p-0.5 text-text-muted transition hover:bg-on-background/6 hover:text-on-background"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
