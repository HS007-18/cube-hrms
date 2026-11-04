
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronLeft, Eye, Loader2, ClipboardCheck, UserPlus, CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { onboardingApi } from './api'
import type { Onboarding, OnboardingDetail, OnboardingTask, CreateOnboardingPayload, CreateOnboardingTaskPayload, OnboardingStatus, TaskStatus } from './types'

const onboardingStatusColors: Record<OnboardingStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  not_started: 'default',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
}

const taskStatusColors: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  pending: 'default',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
}

export function OnboardingPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingDetail | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [taskOnboardingId, setTaskOnboardingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: onboardings = [], isLoading, error } = useQuery({
    queryKey: ['onboardings'],
    queryFn: () => onboardingApi.list(),
  })

  const createOnboarding = useMutation({
    mutationFn: (payload: CreateOnboardingPayload) => onboardingApi.create(payload),
    onSuccess: () => {
      toast.push('Onboarding created successfully')
      queryClient.invalidateQueries({ queryKey: ['onboardings'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create onboarding', 'error'),
  })

  const addTask = useMutation({
    mutationFn: ({ onboardingId, payload }: { onboardingId: number; payload: CreateOnboardingTaskPayload }) =>
      onboardingApi.addTask(onboardingId, payload),
    onSuccess: () => {
      toast.push('Task added')
      if (selectedOnboarding) queryClient.invalidateQueries({ queryKey: ['onboarding', selectedOnboarding.id] })
      setIsTaskOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not add task', 'error'),
  })

  const filteredOnboardings = onboardings.filter((o) => {
    const matchesSearch =
      o.id.toString().includes(search) ||
      o.employee_id.toString().includes(search)
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const tasks: CreateOnboardingTaskPayload[] = []
    createOnboarding.mutate({
      employee_id: Number(formData.get('employee_id')),
      assigned_to: Number(formData.get('assigned_to')) || undefined,
      start_date: formData.get('start_date') as string,
      expected_completion_date: (formData.get('expected_completion_date') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      tasks,
    })
  }

  const handleAddTask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!taskOnboardingId) return
    const formData = new FormData(e.currentTarget)
    addTask.mutate({
      onboardingId: taskOnboardingId,
      payload: {
        onboarding_id: taskOnboardingId,
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
        type: formData.get('type') as string,
        assigned_to: Number(formData.get('assigned_to')) || undefined,
        due_date: (formData.get('due_date') as string) || undefined,
        display_order: Number(formData.get('display_order')) || 0,
      },
    })
  }

  const filteredOnboardings = onboardings.filter((o) => {
    const matchesSearch =
      o.id.toString().includes(search) ||
      o.employee_id.toString().includes(search)
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Onboarding"
        description="Manage onboarding workflows and checklists for new hires"
        action={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Onboarding
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Search onboarding..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter as (v: string) => void}>
            <Select.Trigger className="w-[180px]">
              <Select.Value placeholder="All Status" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              <Select.Item value="not_started">Not Started</Select.Item>
              <Select.Item value="in_progress">In Progress</Select.Item>
              <Select.Item value="completed">Completed</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error instanceof Error ? error.message : 'Failed to load onboarding'} />
        ) : isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading onboarding...</p>
            </div>
          </Card>
        ) : filteredOnboardings.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No onboarding workflows found"
            description={isHrAdmin ? 'Create your first onboarding workflow to get started' : 'No onboarding workflows available'}
            action={
              isHrAdmin && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Onboarding
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
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Expected Completion</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tasks</TableCell>
                  <TableCell>Created</TableCell>
                  {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOnboardings.map((onboarding) => (
                  <TableRow key={onboarding.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{onboarding.id}</TableCell>
                    <TableCell>{onboarding.employee_id}</TableCell>
                    <TableCell>{formatDate(onboarding.start_date)}</TableCell>
                    <TableCell>{onboarding.expected_completion_date ? formatDate(onboarding.expected_completion_date) : 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge variant={onboardingStatusColors[onboarding.status as OnboardingStatus]} dot>
                        {onboarding.status.replace('_', ' ').replace(/\w/g, l => l.toUpperCase())}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{onboarding.tasks?.length || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(onboarding.created_at.split('T')[0])}
                    </TableCell>
                    {isHrAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              onboardingApi.get(onboarding.id).then(setSelectedOnboarding)
                              setView('detail')
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTaskOnboardingId(onboarding.id)
                              setIsTaskOpen(true)
                            }}
                            title="Add Task"
                          >
                            <Plus className="h-4 w-4" />
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Onboarding Workflow</DialogTitle>
            <DialogDescription>
              Set up a new onboarding workflow for a new hire
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee ID" name="employee_id" type="number" required />
              <Field label="Assigned To (ID)" name="assigned_to" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" name="start_date" type="date" required />
              <Field label="Expected Completion" name="expected_completion_date" type="date" />
            </div>
            <Field label="Notes" name="notes" type="textarea" rows={3} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOnboarding.isPending}>
                {createOnboarding.isPending ? 'Creating...' : 'Create Onboarding'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Onboarding Task</DialogTitle>
            <DialogDescription>
              Add a task to the onboarding workflow
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 p-4">
            <Field label="Title" name="title" required />
            <Field label="Description" name="description" type="textarea" rows={2} />
            <Field label="Type" name="type" required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assigned To (ID)" name="assigned_to" type="number" />
              <Field label="Due Date" name="due_date" type="date" />
            </div>
            <Field label="Display Order" name="display_order" type="number" defaultValue={0} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addTask.isPending}>
                {addTask.isPending ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
