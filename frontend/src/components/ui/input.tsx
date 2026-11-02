import { ChevronDown, ChevronUp } from 'lucide-react'
import React, {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const controlClass =
  'w-full rounded-xl border border-on-background/10 bg-surface/70 px-3 text-sm text-on-background shadow-[0_1px_0_rgba(255,255,255,.8)_inset] transition placeholder:text-on-background/55 hover:border-on-background/20 focus:border-primary-600 focus:bg-surface/90 focus:outline-none focus:ring-4 focus:ring-primary-600/12 disabled:cursor-not-allowed disabled:opacity-60'

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
        className="flex items-center gap-1 text-[12px] font-semibold text-on-background"
        htmlFor={htmlFor}
      >
        {label}
        {required ? <span className="text-primary-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-error-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-on-background/70">{hint}</p>
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
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const optionElements = React.Children.toArray(children) as React.ReactElement<{
    value: string | number
    children: ReactNode
    disabled?: boolean
  }>[]

  const handleOptionSelect = (value: string | number) => {
    setOpen(false)
    if (props.onChange) {
      props.onChange({
        target: { value },
      } as React.ChangeEvent<HTMLSelectElement>)
    }
  }

  return (
    <div ref={selectRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          controlClass,
          'h-10 flex items-center justify-between pr-9',
          open
            ? 'border-primary-600 focus:border-primary-600'
            : 'focus:border-primary-600',
          className,
        )}
        aria-expanded={open}
      >
        <span>{placeholder}</span>
        <span>
          {open ? <ChevronUp className="size-4 text-on-background/70" /> : <ChevronDown className="size-4 text-on-background/70" />}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border border-on-background/10 bg-surface/95 shadow-[0_20px_40px_-10px_rgba(0,0,0,.3)] overflow-y-auto max-h-48"
          role="listbox"
        >
          {optionElements.map((option, index) => {
            const isDisabled = option.props.disabled
            return (
              <button
                key={index}
                type="button"
                disabled={isDisabled}
                onClick={() => handleOptionSelect(option.props.value)}
                role="option"
                aria-selected={String(option.props.value) === String(props.value)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition',
                  isDisabled
                    ? 'text-on-background/50 cursor-not-allowed'
                    : String(option.props.value) === String(props.value)
                    ? 'bg-primary-600 text-on-primary font-medium'
                    : 'text-on-background hover:bg-on-background/6',
                )}
              >
                {option.props.children}
              </button>
            )
          })}
        </div>
      )}
      <input
        type="hidden"
        defaultValue={props.defaultValue}
        {...(props.value !== undefined && { value: props.value })}
        {...(props.name && { name: props.name })}
        {...(props.required && { required: true })}
      />
    </div>
  )
}
