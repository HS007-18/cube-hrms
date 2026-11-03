import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Table } from '@/components/ui/table'
import { Building, Users, Clock } from 'lucide-react'

const tenantRows = [
  {
    name: 'TechNova Solutions Pvt Ltd',
    slug: 'technova',
    plan: 'Scale',
    status: 'Active',
    users: 17,
    employees: 16,
    lastActivity: 'Today, 10:32 AM',
  },
  {
    name: 'GreenField Logistics Pvt Ltd',
    slug: 'greenfield',
    plan: 'Basic',
    status: 'Active',
    users: 17,
    employees: 16,
    lastActivity: 'Today, 09:45 AM',
  },
]

export function SuperAdminTenantsPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Super Admin Portal'
        title='Tenant Management'
        description='View and manage all companies using the Cube AI Solutions HRMS platform.'
      />

      <Card>
        <div className='overflow-x-auto'>
          <Table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Users</th>
                <th>Employees</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenantRows.map((row) => (
                <tr key={row.slug}>
                  <td className='flex items-center gap-3'>
                    <Building className='size-4 text-[#64748B]' />
                    <div>
                      <div className='font-medium text-[#111D36]'>{row.name}</div>
                      <div className='text-xs text-[#64748B]'>{row.slug}</div>
                    </div>
                  </td>
                  <td>{row.plan}</td>
                  <td>
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[10px] font-medium text-[#15803D]'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#15803D]' />
                      {row.status}
                    </span>
                  </td>
                  <td>{row.users}</td>
                  <td>{row.employees}</td>
                  <td>{row.lastActivity}</td>
                  <td>
                    <button className='text-[12px] font-medium text-cube-primary hover:text-cube-primary-hover'>
                      Open tenant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}