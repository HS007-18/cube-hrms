import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { goalsApi } from './api'
import type { GoalsItem, CreateGoalsPayload } from './types'
import type { PaginatedResponse } from '@/features/reports/api'

export function GoalsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: items = { items: [], total: 0, limit: 0, offset: 0 }, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list(),
  })

  const createItem = useMutation({
    mutationFn: (payload: CreateGoalsPayload) => goalsApi.create(payload),
    onSuccess: () => {
      toast.push('Goal created successfully')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create goal', 'error'),
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
      goal_type: formData.get('goal_type') as 'individual' | 'team' | 'company',
      target_value: Number(formData.get('target_value')) || 0,
      current_value: Number(formData.get('current_value')) || 0,
      unit: formData.get('unit') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      owner_id: Number(formData.get('owner_id')) || 0,
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & Performance"
        description="Manage goals and performance tracking"
        actions={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15"
            />
          </div>
        </div>

        {error ? (
          <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to load goals'}</div>
        ) : isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading goals...</p>
            </div>
          </Card>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No goals found"
            description={isHrAdmin ? 'Create your first goal to get started' : 'No goals available'}
            action={
              isHrAdmin && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              )
            }
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Current</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Created</TableCell>
                  {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="capitalize">{item.goal_type}</TableCell>
                    <TableCell>{item.target_value} {item.unit}</TableCell>
                    <TableCell>{item.current_value} {item.unit}</TableCell>
                    <TableCell>{item.owner_id}</TableCell>
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

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Goal" description="Create a new goal">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
              <Field label="Type" required>
                <Select name="goal_type" required>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="company">Company</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Value" required>
                <input
                  name="target_value"
                  type="number"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
              <Field label="Unit" required>
                <input
                  name="unit"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" required>
                <input
                  name="start_date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
              <Field label="End Date" required>
                <input
                  name="end_date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Owner ID" required>
                <input
                  name="owner_id"
                  type="number"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
              <Field label="Current Value">
                <input
                  name="current_value"
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                />
              </Field>
            </div>
            <Field label="Unit" required>
              <input
                name="unit"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Create Goal'}</Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
