import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

export function SuperAdminLoginPage() {
  const { login, status, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    return <Navigate to='/' replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const profile = await login(email.trim(), password.trim())
      if (!profile.is_platform_admin) {
        // Not a super admin — redirect to company portal on 5173
        window.location.href = 'http://localhost:5173/login?error=not_super_admin'
        return
      }
      navigate('/', { replace })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title='Super Admin Sign In'
      subtitle='Platform-level access to all tenants. Sign in with your Cube AI Solutions administrator credentials.'
    >
      <form onSubmit={handleSubmit} className='space-y-5' noValidate>
        <Field label='Work email' htmlFor='email'>
          <div className='relative'>
            <Mail
              className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cube-text-muted'
              aria-hidden
            />
            <Input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              required
              placeholder='admin@cubeaisolutions.com'
              className='pl-9'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        <Field label='Password' htmlFor='password'>
          <div className='relative'>
            <LockKeyhole
              className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cube-text-muted'
              aria-hidden
            />
            <Input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
              required
              placeholder='Enter your password'
              className='pl-9 pr-10'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type='button'
              onClick={() => setShowPassword((current) => !current)}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-cube-text-muted transition hover:bg-cube-surface-hover/6 hover:text-cube-on-background'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
            </button>
          </div>
        </Field>

        {error ? (
          <div
            className='rounded-xl border border-cube-error-light/20 bg-cube-error-light px-3.5 py-2.5 text-[12px] font-medium text-cube-error'
            role='alert'
          >
            {error}
          </div>
        ) : null}

        <Button type='submit' size='lg' className='w-full' loading={submitting}>
          Sign in to Super Admin
        </Button>
      </form>
    </AuthLayout>
  )
}