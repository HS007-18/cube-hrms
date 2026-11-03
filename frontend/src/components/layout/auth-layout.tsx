import { ShieldCheck, Sparkles } from 'lucide-react'
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
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr] bg-[#F0F5FF]">
      {/* Futuristic Deep Navy Brand Showcase Panel */}
      <section className="relative hidden overflow-hidden bg-cube-navy-primary px-12 py-14 text-white lg:flex lg:flex-col justify-between">
        {/* Subtle Ambient Glowing Background Mesh */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-cube-blue-deep/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-cube-cyan/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/cubeai-logo-dark.png"
            alt="CubeAI Solutions"
            className="h-11 w-auto object-contain"
          />
        </div>

        <div className="relative z-10 my-auto max-w-lg py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cube-cyan/30 bg-cube-cyan/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cube-cyan mb-6">
            <Sparkles className="size-3 text-cube-cyan" />
            <span>Futuristic Human Capital</span>
          </div>

          <h1 className="font-heading text-[30px] lg:text-[32px] font-bold leading-[1.15] tracking-tight text-white">
            The intelligent engine behind high-performing enterprises.
          </h1>

          <p className="mt-6 max-w-md text-[14.5px] leading-relaxed text-[#94A3B8]">
            Attendance, leave, employee records, and payroll governance — one unified workspace designed for modern enterprise workflows.
          </p>

          <div className="mt-8 h-px w-24 bg-gradient-to-r from-cube-cyan to-transparent" />

          <ul className="mt-8 space-y-3.5 text-[13px] text-[#CBD5E1]">
            <li className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-cube-cyan">
                <ShieldCheck className="size-4" aria-hidden />
              </span>
              <span>Tenant-isolated with PostgreSQL row-level security</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-cube-cyan">
                <ShieldCheck className="size-4" aria-hidden />
              </span>
              <span>Role-based access control and audited compliance</span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-500">
          CubeAI Solutions HRMS · Enterprise Edition
        </p>
      </section>

      {/* Clean Light Sign-in Form Section */}
      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-8 sm:p-10 shadow-[0_12px_40px_rgba(7,86,185,0.06)] border border-[#E2E8F0]">
          {/* Mobile Brand Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/cubeai-logo.png"
              alt="CubeAI Solutions"
              className="h-9 w-auto object-contain"
            />
          </div>

          <p className="mb-1 text-small-label uppercase tracking-wider text-cube-blue-deep">
            Welcome back
          </p>
          <h2 className="font-heading text-[22px] sm:text-[24px] font-semibold tracking-tight text-[#111D36] leading-tight">
            {title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
