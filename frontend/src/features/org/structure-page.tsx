import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Layers3, Network, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { orgApi } from './api'
import type { Department, Designation } from './types'

export function StructurePage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [departmentOpen, setDepartmentOpen] = useState(false)
  const [designationOpen, setDesignationOpen] = useState(false)
  const [departmentName, setDepartmentName] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [designationTitle, setDesignationTitle] = useState('')
  const [designationLevel, setDesignationLevel] = useState('1')

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments })
  const designations = useQuery({ queryKey: ['designations'], queryFn: orgApi.designations })

  const createDepartment = useMutation({
    mutationFn: () =>
      orgApi.createDepartment({
        name: departmentName.trim(),
        code: departmentCode.trim() || undefined,
      }),
    onSuccess: (department) => {
      toast.push(`${department.name} added`)
      setDepartmentOpen(false)
      setDepartmentName('')
      setDepartmentCode('')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not add the department', 'error'),
  })

  const createDesignation = useMutation({
    mutationFn: () =>
      orgApi.createDesignation({
        title: designationTitle.trim(),
        level: Number(designationLevel) || 1,
      }),
    onSuccess: (designation) => {
      toast.push(`${designation.title} added`)
      setDesignationOpen(false)
      setDesignationTitle('')
      setDesignationLevel('1')
      queryClient.invalidateQueries({ queryKey: ['designations'] })
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not add the designation', 'error'),
  })

  if (departments.isLoading || designations.isLoading) return <PageSkeleton />
  if (departments.isError || designations.isError) {
    return (
      <ErrorState
        title="Structure unavailable"
        message="Departments or designations could not be loaded."
        onRetry={() => {
          void departments.refetch()
          void designations.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation"
        title="Structure"
        description="The departments and designation levels that shape reporting, filters, and payroll groupings across the company."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDesignationOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Designation
            </Button>
            <Button onClick={() => setDepartmentOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Department
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <CardHeader
            eyebrow="Departments"
            title={`${departments.data?.length ?? 0} active departments`}
            description="Departments group people for attendance views and headcount reporting."
            action={
              <Button variant="ghost" size="sm" onClick={() => setDepartmentOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                Add
              </Button>
            }
          />
          <div className="mt-5">
            {departments.data && departments.data.length > 0 ? (
              <ul className="divide-y divide-[#E2E8F0]">
                {departments.data.map((department) => (
                  <DepartmentRow
                    key={department.id}
                    department={department}
                    parent={departments.data.find((item) => item.id === department.parent_id)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Building2}
                title="No departments yet"
                description="Add departments to organise the directory and reporting."
                action={<Button onClick={() => setDepartmentOpen(true)}>Add department</Button>}
              />
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            eyebrow="Designations"
            title={`${designations.data?.length ?? 0} designations`}
            description="Levels are advisory today and will drive approval chains and payroll bands."
            action={
              <Button variant="ghost" size="sm" onClick={() => setDesignationOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                Add
              </Button>
            }
          />
          <div className="mt-5">
            {designations.data && designations.data.length > 0 ? (
              <ul className="divide-y divide-[#E2E8F0]">
                {designations.data.map((designation) => (
                  <DesignationRow key={designation.id} designation={designation} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Layers3}
                title="No designations yet"
                description="Add job titles and levels to describe how the company is structured."
                action={<Button onClick={() => setDesignationOpen(true)}>Add designation</Button>}
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between bg-[#F8FAFC] border border-[#E2E8F0]">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FF] text-cube-blue-electric">
            <Network className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#111D36]">Reporting lines live on people</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
              Set a manager on each employee from the People directory. Managers review only their
              direct reports’ leave requests.
            </p>
          </div>
        </div>
      </Card>

      <Dialog
        open={departmentOpen}
        onClose={() => setDepartmentOpen(false)}
        title="Add a department"
        description="Names must be unique within the workspace."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDepartmentOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="department-form"
              loading={createDepartment.isPending}
              disabled={departmentName.trim().length < 2}
            >
              Add department
            </Button>
          </>
        }
      >
        <form
          id="department-form"
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (departmentName.trim().length >= 2) createDepartment.mutate()
          }}
        >
          <Field label="Department name" htmlFor="departmentName" required>
            <Input
              id="departmentName"
              value={departmentName}
              onChange={(event) => setDepartmentName(event.target.value)}
              placeholder="Production"
            />
          </Field>
          <Field label="Short code" htmlFor="departmentCode" hint="Optional, for exports and payroll.">
            <Input
              id="departmentCode"
              value={departmentCode}
              onChange={(event) => setDepartmentCode(event.target.value.toUpperCase())}
              placeholder="PROD"
              maxLength={10}
            />
          </Field>
        </form>
      </Dialog>

      <Dialog
        open={designationOpen}
        onClose={() => setDesignationOpen(false)}
        title="Add a designation"
        description="Levels run from 1 (entry) upwards. They are advisory in this release."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDesignationOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="designation-form"
              loading={createDesignation.isPending}
              disabled={designationTitle.trim().length < 2}
            >
              Add designation
            </Button>
          </>
        }
      >
        <form
          id="designation-form"
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (designationTitle.trim().length >= 2) createDesignation.mutate()
          }}
        >
          <Field label="Title" htmlFor="designationTitle" required>
            <Input
              id="designationTitle"
              value={designationTitle}
              onChange={(event) => setDesignationTitle(event.target.value)}
              placeholder="Senior Executive"
            />
          </Field>
          <Field label="Level" htmlFor="designationLevel" hint="A whole number from 1 to 10.">
            <Input
              id="designationLevel"
              type="number"
              min={1}
              max={10}
              value={designationLevel}
              onChange={(event) => setDesignationLevel(event.target.value)}
            />
          </Field>
        </form>
      </Dialog>
    </div>
  )
}

function DepartmentRow({ department, parent }: { department: Department; parent?: Department }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FF] text-cube-blue-electric">
          <Building2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-[#111D36]">{department.name}</p>
          <p className="truncate text-[11.5px] text-[#64748B]">
            {department.code ? `Code ${department.code}` : 'Top-level department'}
            {parent ? ` · Under ${parent.name}` : ''}
          </p>
        </div>
      </div>
    </li>
  )
}

function DesignationRow({ designation }: { designation: Designation }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#CFFAFE] text-cyan-700">
          <Layers3 className="size-4" aria-hidden />
        </span>
        <p className="truncate text-[13.5px] font-semibold text-[#111D36]">{designation.title}</p>
      </div>
      <Badge tone={designation.level >= 4 ? 'pending' : 'cyan'}>Level {designation.level}</Badge>
    </li>
  )
}
