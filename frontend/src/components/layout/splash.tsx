import { Loader2 } from 'lucide-react'
import { BrandMark, BrandWordmark } from '@/components/layout/brand'

export function Splash({ label = 'Preparing your workspace' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="flex items-center gap-3 rounded-2xl bg-pine-950 px-5 py-4 shadow-xl">
        <BrandMark />
        <BrandWordmark />
      </div>
      <p className="flex items-center gap-2 text-xs font-medium text-slate-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {label}
      </p>
    </div>
  )
}
