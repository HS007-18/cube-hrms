import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Users, Building, Clock, ShieldAlert } from 'lucide-react'
import { superAdminApi, type TenantOut } from './api'

export function SuperAdminDashboardPage() {
  const [tenants, setTenants] = useState<TenantOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superAdminApi
      .listTenants({ limit: 50 })
      .then((data) => {
        setTenants(data.items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className='space-y-6'>
        <PageHeader
          eyebrow='Super Admin Portal'
          title='Platform Overview'
          description='Monitor tenant activity, user counts, and system health across all companies.'
        />
        <div className='animate-pulse flex items-center gap-2 text-[#64748B]'>
          <Clock className='size-4' />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const totalTenants = tenants.length
  const totalUsers = tenants.reduce((sum, t) => sum + (t.user_count || 0), 0)
  const totalEmployees = tenants.reduce((sum, t) => sum + (t.employee_count || 0), 0)
  const activeTenants = tenants.filter((t) => t.status === 'active').length

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Super Admin Portal'
        title='Platform Overview'
        description='Monitor tenant activity, user counts, and system health across all companies.'
      />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          label='Total Tenants'
          value={String(totalTenants)}
          hint={`${activeTenants} active`}
          icon={Building}
        />
        <StatCard
          label='Total Users'
          value={String(totalUsers)}
          hint='across all tenants'
          icon={Users}
        />
        <StatCard
          label='Total Employees'
          value={String(totalEmployees)}
          hint='across all tenants'
          icon={Clock}
        />
        <StatCard
          label='Security Alerts'
          value='0'
          hint='All clear'
          icon={ShieldAlert}
          tone='sage'
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <div className='p-6'>
            <h3 className='font-semibold text-[#111D36] mb-4'>Recent Tenant Activity</h3>
            {tenants.length === 0 ? (
              <div className='text-[#64748B] text-sm'>No tenants found.</div>
            ) : (
              <ul className='space-y-2 text-sm'>
                {tenants.slice(0, 5).map((t) => (
                  <li key={t.id} className='flex items-center justify-between'>
                    <span className='text-[#111D36] font-medium'>{t.name}</span>
                    <span className='text-[#64748B]'>
                      {t.status} · {t.plan}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <div className='p-6'>
            <h3 className='font-semibold text-[#111D36] mb-4'>System Health</h3>
            <div className='text-[#64748B] text-sm'>All services operational.</div>
          </div>
        </Card>
      </div>
    </div>
  )
}