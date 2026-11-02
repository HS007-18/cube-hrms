import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-pine-950 text-gold-400">
        <Compass className="size-6" aria-hidden />
      </span>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 text-3xl">This page is not on the map</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-muted">
        The link may be outdated, or the page may belong to another workspace.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to your workspace</Button>
      </Link>
    </div>
  )
}
