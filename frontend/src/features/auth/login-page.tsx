import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

const demoAccounts = [
  { label: 'HR administrator', email: 'priya@aurora.example', password: 'Aurora@2026' },
  { label: 'People manager', email: 'arjun@aurora.example', password: 'Employee@2026' },
  { label: 'Employee', email: 'meera@aurora.example', password: 'Employee@2026' },
  { label: 'Platform admin', email: 'admin@cube.io', password: 'Cube@Admin#2026' },
]

export function LoginPage() {
  const { login, status, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    return <Navigate to={user.is_platform_admin ? '/tenants' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const profile = await login(email.trim(), password)
      navigate(profile.is_platform_admin ? '/tenants' : '/dashboard', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in to your workspace"
      subtitle="Use the credentials issued by your HR administrator. Sessions are scoped to a single tenant."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Work email" htmlFor="email">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cube-text-muted"
              aria-hidden
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="pl-9"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cube-text-muted"
              aria-hidden
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="pl-9 pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-cube-text-muted transition hover:bg-cube-surface-hover/6 hover:text-cube-on-background"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {error ? (
          <div
            className="rounded-xl border border-cube-error-light/20 bg-cube-error-light px-3.5 py-2.5 text-[12px] font-medium text-cube-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS !== 'false' ? (
        <div className="mt-8 rounded-2xl border border-cube-border bg-cube-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cube-text-muted">
            Demo accounts
          </p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(account.password)
                  setError('')
                }}
                className="rounded-lg px-2.5 py-2 text-left transition hover:bg-cube-surface-hover"
              >
                <span className="block text-[11px] font-semibold text-cube-on-background">
                  {account.label}
                </span>
                <span className="block truncate text-[10px] text-cube-text-muted">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 px-2.5 text-[10px] leading-relaxed text-cube-text-muted">
            Demo credentials are seeded for local development only.
          </p>
        </div>
      ) : null}
    </AuthLayout>
  )
}
