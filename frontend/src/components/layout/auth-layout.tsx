import { ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-cube-background px-12 py-14 text-cube-on-background lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl ring-1 ring-cube-primary/10">
            <img src="/cube-icon.webp" alt="CUBE" className="size-7" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide">CUBE</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cube-primary-light">
              Human capital
            </p>
          </div>
        </div>

        <div className="my-auto max-w-lg py-16">
          <p className="eyebrow !text-cube-primary">People operations, composed</p>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4.2rem)] font-normal leading-[0.98] text-cube-on-background">
            The quiet engine behind a well-run company.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cube-text-muted">
            Attendance, leave, and employee records for Indian teams — one accountable
            workspace, built for the way HR actually works.
          </p>
          <div className="mt-10 h-px w-24 bg-cube-primary-light" />
          <ul className="mt-8 space-y-3 text-[13px] text-cube-text-muted">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-cube-primary" aria-hidden />
              Tenant-isolated by Postgres row-level security
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-cube-primary" aria-hidden />
              India-first dates, leave policy, and statutory records
            </li>
          </ul>
        </div>

        <p className="text-[10px] uppercase tracking-[0.22em] text-cube-text-muted">
          CUBE HRMS · Foundation release
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-cube-background ring-1 ring-cube-primary/10">
              <img src="/cube-icon.webp" alt="CUBE" className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-cube-on-background">CUBE</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-cube-primary">
                Human capital
              </p>
            </div>
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,2.6rem)] leading-[1.02]">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-cube-text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
