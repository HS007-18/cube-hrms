
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronLeft, Eye, Loader2, Briefcase, UserPlus, Search } from 'lucide-react'
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
import { recruitmentApi } from './api'
import type { Recruitment, RecruitmentDetail, Application, CreateRecruitmentPayload, CreateApplicationPayload, RecruitmentStatus, ApplicationStatus } from './types'

const recruitmentStatusColors: Record<RecruitmentStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  open: 'success',
  closed: 'default',
  on_hold: 'secondary',
  cancelled: 'destructive',
}

const applicationStatusColors: Record<ApplicationStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  applied: 'default',
  screening: 'secondary',
  interview: 'outline',
  offer: 'success',
  hired: 'success',
  rejected: 'destructive',
}

export function RecruitmentPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedRecruitment, setSelectedRecruitment] = useState<RecruitmentDetail | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [applyRecruitmentId, setApplyRecruitmentId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RecruitmentStatus | 'all'>('all')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: recruitments = [], isLoading, error } = useQuery({
    queryKey: ['recruitments'],
    queryFn: () => recruitmentApi.list(),
  })

  const createRecruitment = useMutation({
    mutationFn: (payload: CreateRecruitmentPayload) => recruitmentApi.create(payload),
    onSuccess: () => {
      toast.push('Job posting created successfully')
      queryClient.invalidateQueries({ queryKey: ['recruitments'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create job posting', 'error'),
  })

  const apply = useMutation({
    mutationFn: ({ recruitmentId, payload }: { recruitmentId: number; payload: CreateApplicationPayload }) =>
      recruitmentApi.apply(recruitmentId, payload),
    onSuccess: () => {
      toast.push('Application submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['recruitment', applyRecruitmentId] })
      setIsApplyOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not submit application', 'error'),
  })

  const filteredRecruitments = recruitments.filter((r) => {
    const matchesSearch =
      r.id.toString().includes(search) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createRecruitment.mutate({
      title: formData.get('title') as string,
      department_id: Number(formData.get('department_id')) || undefined,
      designation_id: Number(formData.get('designation_id')) || undefined,
      description: (formData.get('description') as string) || undefined,
      requirements: (formData.get('requirements') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      employment_type: formData.get('employment_type') as string || 'full_time',
      min_salary: Number(formData.get('min_salary')) || undefined,
      max_salary: Number(formData.get('max_salary')) || undefined,
      openings: Number(formData.get('openings')) || 1,
    })
  }

  const handleApply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!applyRecruitmentId) return
    const formData = new FormData(e.currentTarget)
    apply.mutate({
      recruitmentId: applyRecruitmentId,
      payload: {
        recruitment_id: applyRecruitmentId,
        full_name: formData.get('full_name') as string,
        email: formData.get('email') as string,
        phone: (formData.get('phone') as string) || undefined,
        resume_url: (formData.get('resume_url') as string) || undefined,
        cover_letter: (formData.get('cover_letter') as string) || undefined,
        current_company: (formData.get('current_company') as string) || undefined,
        current_ctc: Number(formData.get('current_ctc')) || undefined,
        expected_ctc: Number(formData.get('expected_ctc')) || undefined,
        notice_period_days: Number(formData.get('notice_period_days')) || undefined,
        source: (formData.get('source') as string) || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Management"
        description="Manage job postings, applications, and hiring pipeline"
        action={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Job Posting
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Search jobs..."
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
              <Select.Item value="open">Open</Select.Item>
              <Select.Item value="closed">Closed</Select.Item>
              <Select.Item value="on_hold">On Hold</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error instanceof Error ? error.message : 'Failed to load job postings'} />
        ) : isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading job postings...</p>
            </div>
          </Card>
        ) : filteredRecruitments.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No job postings found"
            description={isHrAdmin ? 'Create your first job posting to get started' : 'No open positions available'}
            action={
              isHrAdmin && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job Posting
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
                  <TableCell>Title</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Openings</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posted</TableCell>
                  {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecruitments.map((recruitment) => (
                  <TableRow key={recruitment.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">{recruitment.id}</TableCell>
                    <TableCell className="font-medium">{recruitment.title}</TableCell>
                    <TableCell>{recruitment.location || 'Remote'}</TableCell>
                    <TableCell className="capitalize">{recruitment.employment_type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-center">{recruitment.openings}</TableCell>
                    <TableCell>
                      <StatusBadge variant={recruitmentStatusColors[recruitment.status as RecruitmentStatus]} dot>
                        {recruitment.status.replace('_', ' ').replace(/\w/g, l => l.toUpperCase())}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(recruitment.posted_at.split('T')[0])}
                    </TableCell>
                    {isHrAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              recruitmentApi.get(recruitment.id).then(setSelectedRecruitment)
                              setView('detail')
                            }}
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Job Posting</DialogTitle>
            <DialogDescription>
              Create a new job posting for your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" name="title" required />
              <Field
                label="Employment Type"
                name="employment_type"
                type="select"
                options={[
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'internship', label: 'Internship' },
                ]}
                defaultValue="full_time"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department ID" name="department_id" type="number" />
              <Field label="Designation ID" name="designation_id" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Location" name="location" />
              <Field label="Openings" name="openings" type="number" defaultValue={1} min={1} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Salary" name="min_salary" type="number" />
              <Field label="Max Salary" name="max_salary" type="number" />
            </div>
            <Field label="Description" name="description" type="textarea" rows={3} />
            <Field label="Requirements" name="requirements" type="textarea" rows={3} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRecruitment.isPending}>
                {createRecruitment.isPending ? 'Creating...' : 'Create Job Posting'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
