import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { platformAuditApi } from './api'
import type { PlatformAuditItem, CreatePlatformAuditPayload } from './types'
import type { PaginatedResponse } from '@/features/reports/api'

export function PlatformAuditPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isPlatformAdmin = user?.role === 'platform_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, isLoading, error } = useQuery({
    queryKey: ['platform-audit'],
    queryFn: () => platformAuditApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreatePlatformAuditPayload) => platformAuditApi.create(payload),
    onSuccess: () => {
      toast.push('Platform audit created successfully')
      queryClient.invalidateQueries({ queryKey: ['platform-audit'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create platform audit', 'error'),
  })

  const itemsArray = 'items' in items ? items.items : items
  const filteredItems = itemsArray.filter((item) =>
    item.id.toString().includes(search) ||
    item.action.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createItem.mutate({
      tenant_id: Number(formData.get('tenant_id')) || undefined,
      user_id: Number(formData.get('user_id')) || undefined,
      action: formData.get('action') as string,
      resource_type: formData.get('resource_type') as string,
      resource_id: (formData.get('resource_id') as string) || undefined,
      old_values: (formData.get('old_values') as string) ? JSON.parse(formData.get('old_values') as string) : undefined,
      new_values: (formData.get('new_values') as string) ? JSON.parse(formData.get('new_values') as string) : undefined,
      ip_address: (formData.get('ip_address') as string) || undefined,
      user_agent: (formData.get('user_agent') as string) || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Audit Logs"
        description="View and manage platform audit logs"
        actions={
          isPlatformAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Audit Entry
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load audit logs'}</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Tenant</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Created</TableCell>
                  {isPlatformAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.action}</TableCell>
                    <TableCell>{item.resource_type}</TableCell>
                    <TableCell>{item.tenant_id || 'N/A'}</TableCell>
                    <TableCell>{item.user_id || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.created_at.split('T')[0]}</TableCell>
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

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Audit Entry" description="Create a new audit log entry">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tenant ID (optional)">
              <input
                name="tenant_id"
                type="number"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <Field label="User ID (optional)">
              <input
                name="user_id"
                type="number"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Action" required>
              <input
                name="action"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <Field label="Resource Type" required>
              <input
                name="resource_type"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Resource ID (optional)">
              <input
                name="resource_id"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <Field label="IP Address (optional)">
              <input
                name="ip_address"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Old Values (JSON, optional)">
              <textarea
                name="old_values"
                rows={3}
                placeholder='{"field": "old_value"}'
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
              />
            </Field>
            <Field label="New Values (JSON, optional)">
              <textarea
                name="new_values"
                rows={3}
                placeholder='{"field": "new_value"}'
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="User Agent (optional)">
              <input
                name="user_agent"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Create Audit Entry'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
