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
import { PayrollPage } from '@/features/payroll/payroll-page'
import { RecruitmentPage } from '@/features/recruitment/recruitment-page'
import { OnboardingPage } from '@/features/onboarding/onboarding-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { DocumentsPage } from '@/features/documents/documents-page'
import { NotificationsPage } from '@/features/notifications/notifications-page'
import { HolidaysPage } from '@/features/holidays/holidays-page'
import { GoalsPage } from '@/features/goals/goals-page'
import { OffboardingPage } from '@/features/offboarding/offboarding-page'
import { SupportPage } from '@/features/support/support-page'
import { AnnouncementsPage } from '@/features/announcements/announcements-page'
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
                  { path: 'payroll', element: <PayrollPage /> },
                  { path: 'recruitment', element: <RecruitmentPage /> },
                  { path: 'onboarding', element: <OnboardingPage /> },
                  { path: 'reports', element: <ReportsPage /> },
                  { path: 'documents', element: <DocumentsPage /> },
                  { path: 'notifications', element: <NotificationsPage /> },
                  { path: 'holidays', element: <HolidaysPage /> },
                  { path: 'goals', element: <GoalsPage /> },
                  { path: 'offboarding', element: <OffboardingPage /> },
                  { path: 'support', element: <SupportPage /> },
                  { path: 'announcements', element: <AnnouncementsPage /> },
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
