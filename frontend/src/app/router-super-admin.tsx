import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { Splash } from '@/components/layout/splash'
import { NotFoundPage } from '@/app/not-found-page'
import { useAuth } from '@/lib/auth'
import { SuperAdminLoginPage } from '@/features/auth/login-super-admin-page'
import { SuperAdminDashboardPage } from '@/features/super-admin/dashboard-page'
import { SuperAdminTenantsPage } from '@/features/super-admin/tenants-page'
import { SubscriptionsPage } from '@/features/super-admin/subscriptions/subscriptions-page'
import { TenantAnalyticsPage } from '@/features/super-admin/tenant-analytics/tenant-analytics-page'
import { PlatformAuditPage } from '@/features/super-admin/platform-audit/platform-audit-page'
import { SystemHealthPage } from '@/features/super-admin/system-health/system-health-page'

function RequireAuth() {
  const { status, user } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Only platform administrators may open the super-admin console. */
function PlatformOnly() {
  const { user } = useAuth()
  if (!user?.is_platform_admin) return <Navigate to="/login" replace />
  return <Outlet />
}

export const superAdminRouter = createBrowserRouter([
  { path: '/login', element: <SuperAdminLoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <PlatformOnly />,
            children: [
              { index: true, element: <SuperAdminDashboardPage /> },
              { path: 'tenants', element: <SuperAdminTenantsPage /> },
              { path: 'subscriptions', element: <SubscriptionsPage /> },
              { path: 'tenant-analytics', element: <TenantAnalyticsPage /> },
              { path: 'platform-audit', element: <PlatformAuditPage /> },
              { path: 'system-health', element: <SystemHealthPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
