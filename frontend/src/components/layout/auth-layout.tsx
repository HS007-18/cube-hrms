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
      <section className="relative hidden overflow-hidden bg-background px-12 py-14 text-on-background lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl ring-1 ring-primary/10">
            <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
              <path
                d="M16 4 27 10.5v11L16 28 5 21.5v-11L16 4Z"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.6"
              />
              <path
                d="M16 4v24M5 10.5l22 11M27 10.5l-22 11"
                stroke="var(--color-on-background)"
                strokeOpacity=".12"
                strokeWidth=".9"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide">CUBE</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-primary-light">
              Human capital
            </p>
          </div>
        </div>

        <div className="my-auto max-w-lg py-16">
          <p className="eyebrow !text-primary">People operations, composed</p>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4.2rem)] font-normal leading-[0.98] text-on-background">
            The quiet engine behind a well-run company.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-text-muted">
            Attendance, leave, and employee records for Indian teams — one accountable
            workspace, built for the way HR actually works.
          </p>
          <div className="mt-10 h-px w-24 bg-primary-light" />
          <ul className="mt-8 space-y-3 text-[13px] text-text-muted">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Tenant-isolated by Postgres row-level security
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              India-first dates, leave policy, and statutory records
            </li>
          </ul>
        </div>

        <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
          CUBE HRMS · Foundation release
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-primary/10">
              <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
                <path
                  d="M16 4 27 10.5v11L16 28 5 21.5v-11L16 4Z"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-on-background">CUBE</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-primary">
                Human capital
              </p>
            </div>
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,2.6rem)] leading-[1.02]">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
