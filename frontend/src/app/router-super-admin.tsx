import { createBrowserRoute, createRouter } from '@tanstack/react-router'
import { SuperAdminLoginPage } from '@/features/auth/login-super-admin-page'
import { SuperAdminDashboardPage } from '@/features/super-admin/dashboard-page'
import { SuperAdminTenantsPage } from '@/features/super-admin/tenants-page'
import { NotFoundPage } from '@/app/not-found-page'
import { AuthLayout } from '@/components/layout/auth-layout'
import { AppShell } from '@/components/layout/app-shell'

const routeTree = createBrowserRoute({
  id: 'root',
  component: AppShell,
  children: [
    createBrowserRoute({
      id: 'login',
      path: '/login',
      component: SuperAdminLoginPage,
    }),
    createBrowserRoute({
      id: 'dashboard',
      path: '/',
      component: SuperAdminDashboardPage,
    }),
    createBrowserRoute({
      id: 'tenants',
      path: '/tenants',
      component: SuperAdminTenantsPage,
    }),
    createBrowserRoute({
      id: 'not-found',
      path: '*',
      component: NotFoundPage,
    }),
  ],
})

export const superAdminRouter = createRouter({
  routeTree,
  defaultPreload: 'intent',
})