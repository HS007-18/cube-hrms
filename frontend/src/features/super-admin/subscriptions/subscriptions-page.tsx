import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { subscriptionsApi } from './api'
import type { SubscriptionsItem, CreateSubscriptionsPayload } from './types'
import type { PaginatedResponse } from '@/features/reports/api'

export function SubscriptionsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isPlatformAdmin = user?.role === 'platform_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreateSubscriptionsPayload) => subscriptionsApi.create(payload),
    onSuccess: () => {
      toast.push('Subscription plan created successfully')
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create subscription plan', 'error'),
  })

  const itemsArray = 'items' in items ? items.items : items
  const filteredItems = itemsArray.filter((item) =>
    item.id.toString().includes(search) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createItem.mutate({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      price: formData.get('price') as string,
      billing_cycle: formData.get('billing_cycle') as 'monthly' | 'yearly',
      features: (formData.get('features') as string) ? (formData.get('features') as string).split(',').map(s => s.trim()) : [],
      is_active: formData.get('is_active') === 'on',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing Management"
        description="Manage subscription plans and billing"
        actions={
          isPlatformAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load subscriptions'}</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Created</TableCell>
                  {isPlatformAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.price}</TableCell>
                    <TableCell className="capitalize">{item.billing_cycle}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.is_active ? 'active' : 'cancelled'} />
                    </TableCell>
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

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Subscription Plan" description="Create a new subscription plan">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <Field label="Name" required>
            <input
              name="name"
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
            />
          </Field>
          <Field label="Description" required>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price" required>
              <input
                name="price"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <Field label="Billing Cycle" required>
              <Select name="billing_cycle" required>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Field>
          </div>
          <Field label="Features (comma separated)">
            <input
              name="features"
              placeholder="Feature 1, Feature 2, Feature 3"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
            />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" name="is_active" defaultChecked />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Create Plan'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
