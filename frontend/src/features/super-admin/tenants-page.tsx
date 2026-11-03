import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building, Clock } from 'lucide-react'
import { superAdminApi, type TenantOut } from './api'

const statusColors: Record<string, string> = {
  active: 'bg-[#DCFCE7] text-[#15803D]',
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  suspended: 'bg-[#FEE2E2] text-[#991B1B]',
  cancelled: 'bg-[#F3F4F6] text-[#4B5563]',
}

export function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    superAdminApi
      .listTenants({ limit: 50 })
      .then((data) => {
        setTenants(data.items)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className='space-y-6'>
        <PageHeader
          eyebrow='Super Admin Portal'
          title='Tenant Management'
          description='View and manage all companies using the Cube AI Solutions HRMS platform.'
        />
        <div className='animate-pulse flex items-center gap-2 text-[#64748B]'>
          <Clock className='size-4' />
          <span>Loading tenants...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <PageHeader
          eyebrow='Super Admin Portal'
          title='Tenant Management'
          description='View and manage all companies using the Cube AI Solutions HRMS platform.'
        />
        <Card>
          <div className='p-6 text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-xl'>
            Failed to load tenants: {error}
          </div>
        </Card>
      </div>
    )
  }

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
            <TableHeader>
              <tr>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {tenants.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Building className='size-4 text-[#64748B]' />
                      <div>
                        <div className='font-medium text-[#111D36]'>
                          {row.name}
                        </div>
                        <div className='text-xs text-[#64748B]'>
                          {row.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.plan}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusColors[row.status]} text-[10px] font-medium`}>
                      <span className='w-1.5 h-1.5 rounded-full' />
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>{row.user_count}</TableCell>
                  <TableCell>{row.employee_count}</TableCell>
                  <TableCell>
                    <div className='text-xs text-[#64748B]'>
                      {new Date(row.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button className='text-[12px] font-medium text-cube-primary hover:text-cube-primary-hover'>
                      Open tenant
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}