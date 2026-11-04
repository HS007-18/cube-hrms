import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'

import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'

import { notificationsApi } from './api'



export function NotificationsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreateNotificationsPayload) => notificationsApi.create(payload),
    onSuccess: () => {
      toast.push('Notification created successfully')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create notification', 'error'),
  })

  const itemsArray = 'items' in items ? items.items : items
  const filteredItems = itemsArray.filter((item) =>
    item.id.toString().includes(search) ||
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createItem.mutate({
      title: formData.get('title') as string,
      message: (formData.get('message') as string) || '',
      type: (formData.get('type') as 'info' | 'warning' | 'success' | 'error') || 'info',
      recipient_id: Number(formData.get('recipient_id')) || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications Center"
        description="Manage notifications and alerts"
        actions={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load notifications'}</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Read</TableCell>
                  <TableCell>Created</TableCell>
                  {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>{item.is_read ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.created_at.split('T')[0]}</TableCell>
                    {isHrAdmin && (
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

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Notification" description="Create a new notification">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <Field label="Title" required>
            <input
              name="title"
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
            />
          </Field>
          <Field label="Message" required>
            <textarea
              name="message"
              rows={3}
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" required>
              <Select name="type" required>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </Select>
            </Field>
            <Field label="Recipient ID (optional)">
              <input
                name="recipient_id"
                type="number"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Create Notification'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
