import { ChevronDown } from 'lucide-react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const controlClass =
  'w-full rounded-xl border border-pine-900/12 bg-white/70 px-3 text-sm text-slate-ink shadow-[0_1px_0_rgba(255,255,255,.8)_inset] transition placeholder:text-slate-muted/55 hover:border-pine-900/20 focus:border-gold-400 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-gold-500/12 disabled:cursor-not-allowed disabled:opacity-60'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        className="flex items-center gap-1 text-[12px] font-semibold text-pine-900"
        htmlFor={htmlFor}
      >
        {label}
        {required ? <span className="text-gold-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-clay-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-slate-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-24 py-2.5', className)} {...props} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

export function Select({ className, children, placeholder, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(controlClass, 'h-10 appearance-none pr-9', className)}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-muted"
        aria-hidden
      />
    </div>
  )
}
