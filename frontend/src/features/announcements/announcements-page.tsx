import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { announcementsApi } from './api'
import type { CreateAnnouncementsPayload } from './types'
import { Select } from '@/components/ui/input'

export function AnnouncementsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreateAnnouncementsPayload) => announcementsApi.create(payload),
    onSuccess: () => {
      toast.push('Announcement created successfully')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create announcement', 'error'),
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
      content: (formData.get('content') as string) || '',
      target_audience: (formData.get("target_audience") as "all" | "hr_admin" | "managers" | "employees") || "all",
      priority: (formData.get('priority') as 'low' | 'normal' | 'high') || 'normal',
      is_published: formData.get('is_published') === 'on',
      expires_at: (formData.get('expires_at') as string) || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Announcements"
        description="Manage company-wide announcements"
        actions={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load announcements'}</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Audience</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Created</TableCell>
                  {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="capitalize">{item.target_audience}</TableCell>
                    <TableCell className="capitalize">{item.priority}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.is_published ? 'active' : 'pending'} />
                    </TableCell>
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

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Announcement" description="Create a new announcement">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" required>
                <input
                  name="title"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
              <Field label="Target Audience" required>
                <Select name="target_audience" required>
                  <option value="all">All</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="managers">Managers</option>
                  <option value="employees">Employees</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <Select name="priority" defaultValue="normal">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </Select>
              </Field>
              <Field label="Expires At (optional)">
                <input
                  name="expires_at"
                  type="date"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
            </div>
            <Field label="Content" required>
              <textarea
                name="content"
                rows={5}
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
              />
            </Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_published" name="is_published" defaultChecked />
              <label htmlFor="is_published" className="text-sm font-medium">Published</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={false}>Create Announcement</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
