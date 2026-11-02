import { CircleAlert } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Could not load this view',
  message = 'The server did not respond as expected. Try again in a moment.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
        <CircleAlert className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-pine-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  )
}
