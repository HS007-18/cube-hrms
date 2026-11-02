import { Navigate, Outlet } from 'react-router-dom'
import { Splash } from '@/components/layout/splash'
import { useAuth } from '@/lib/auth'

export function RequireAuth() {
  const { status, user } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Platform administrators get the console instead of a tenant workspace. */
export function TenantWorkspace() {
  const { user } = useAuth()
  if (user?.is_platform_admin) return <Navigate to="/tenants" replace />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.is_platform_admin) return <Navigate to="/tenants" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function PlatformOnly() {
  const { user } = useAuth()
  if (!user?.is_platform_admin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.is_platform_admin ? '/tenants' : '/dashboard'} replace />
}
