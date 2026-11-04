import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { tenantAnalyticsApi } from './api'
import type { TenantAnalyticsItem, CreateTenantAnalyticsPayload } from './types'
import type { PaginatedResponse } from '@/features/reports/api'

export function TenantAnalyticsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isPlatformAdmin = user?.role === 'platform_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, isLoading, error } = useQuery({
    queryKey: ['tenant-analytics'],
    queryFn: () => tenantAnalyticsApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreateTenantAnalyticsPayload) => tenantAnalyticsApi.create(payload),
    onSuccess: () => {
      toast.push('Tenant analytics created successfully')
      queryClient.invalidateQueries({ queryKey: ['tenant-analytics'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create tenant analytics', 'error'),
  })

  const itemsArray = 'items' in items ? items.items : items
  const filteredItems = itemsArray.filter((item) =>
    item.id.toString().includes(search) ||
    item.tenant_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createItem.mutate({
      tenant_id: Number(formData.get('tenant_id')) || 0,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Usage Analytics"
        description="Monitor tenant usage and resource consumption"
        actions={
          isPlatformAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Analytics
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search tenant analytics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load tenant analytics'}</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Total Users</TableCell>
                  <TableCell>Employees</TableCell>
                  <TableCell>Storage (MB)</TableCell>
                  <TableCell>API Calls (24h)</TableCell>
                  <TableCell>Last Activity</TableCell>
                  {isPlatformAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.tenant_name}</TableCell>
                    <TableCell>{item.total_users}</TableCell>
                    <TableCell>{item.total_employees}</TableCell>
                    <TableCell>{item.storage_used_mb}</TableCell>
                    <TableCell>{item.api_calls_24h}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.last_activity ? item.last_activity.split('T')[0] : 'N/A'}</TableCell>
                    {isPlatformAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); tenantAnalyticsApi.refresh(item.tenant_id) }}
                            title="Refresh"
                          >
                            <Loader2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Tenant Analytics" description="Create a new tenant analytics entry">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <Field label="Tenant ID" required>
            <input
              name="tenant_id"
              type="number"
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Create Analytics'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
