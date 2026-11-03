import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Users, Building, Clock, ShieldAlert } from 'lucide-react'

export function SuperAdminDashboardPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Super Admin Portal'
        title='Platform Overview'
        description='Monitor tenant activity, user counts, and system health across all companies.'
      />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Tenants'
          value='2'
          trend='+0 this month'
          icon={<Building className='size-5' />}
        />
        <StatCard
          title='Total Users'
          value='35'
          trend='+2 this month'
          icon={<Users className='size-5' />}
        />
        <StatCard
          title='Active Sessions'
          value='12'
          trend='+3 today'
          icon={<Clock className='size-5' />}
        />
        <StatCard
          title='Security Alerts'
          value='0'
          trend='All clear'
          icon={<ShieldAlert className='size-5' />}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <div className='p-6'>
            <h3 className='font-semibold text-[#111D36] mb-4'>Recent Tenant Activity</h3>
            <div className='text-[#64748B] text-sm'>No recent activity to display.</div>
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