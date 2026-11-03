import { RouterProvider } from 'react-router-dom'
import { superAdminRouter } from '@/app/router-super-admin'

export default function AppSuperAdmin() {
  return <RouterProvider router={superAdminRouter} />
}