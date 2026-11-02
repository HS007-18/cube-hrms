import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import {
  HomeRedirect,
  PlatformOnly,
  RequireAuth,
  RequireRole,
  TenantWorkspace,
} from '@/app/guards'
import { LoginPage } from '@/features/auth/login-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { EmployeesPage } from '@/features/employees/employees-page'
import { StructurePage } from '@/features/org/structure-page'
import { AttendancePage } from '@/features/attendance/attendance-page'
import { LeavePage } from '@/features/leave/leave-page'
import { TenantsPage } from '@/features/tenants/tenants-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { NotFoundPage } from '@/app/not-found-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            element: <TenantWorkspace />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'attendance', element: <AttendancePage /> },
              { path: 'leave', element: <LeavePage /> },
              {
                element: <RequireRole roles={['hr_admin']} />,
                children: [
                  { path: 'employees', element: <EmployeesPage /> },
                  { path: 'structure', element: <StructurePage /> },
                ],
              },
            ],
          },
          { path: 'profile', element: <ProfilePage /> },
          {
            element: <PlatformOnly />,
            children: [{ path: 'tenants', element: <TenantsPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
