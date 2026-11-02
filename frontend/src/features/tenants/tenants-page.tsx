import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/components/ui/toast'
import { useDebouncedValue } from '@/lib/hooks'
import { formatDate } from '@/lib/format'
import { tenantsApi, type TenantCreatePayload } from './api'
import type { Tenant, TenantDetail } from './types'

interface CreateForm {
  name: string
  slug: string
  plan: TenantCreatePayload['plan']
  contactEmail: string
  ownerName: string
  ownerEmail: string
}

const emptyForm: CreateForm = {
  name: '',
  slug: '',
  plan: 'basic',
  contactEmail: '',
  ownerName: '',
  ownerEmail: '',
}

const planTone: Record<string, 'neutral' | 'info' | 'pending' | 'success'> = {
  free: 'neutral',
  basic: 'info',
  scale: 'pending',
  enterprise: 'success',
}

export function TenantsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [slugEdited, setSlugEdited] = useState(false)
  const [credential, setCredential] = useState<{
    tenantName: string
    email: string
    password: string
  } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Tenant | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim())

  const tenants = useQuery({
    queryKey: ['tenants', { q: debouncedSearch, status }],
    queryFn: () =>
      tenantsApi.list({
        q: debouncedSearch || undefined,
        status: status || undefined,
        limit: 50,
      }),
  })

  const allTenants = useQuery({
    queryKey: ['tenants', 'all'],
    queryFn: () => tenantsApi.list({ limit: 100 }),
  })

  const detail = useQuery({
    queryKey: ['tenants', selectedId],
    queryFn: () => tenantsApi.detail(selectedId!),
    enabled: selectedId !== null,
  })

  const create = useMutation({
    mutationFn: () =>
      tenantsApi.create({
        name: form.name.trim(),
        slug: form.slug.trim(),
        plan: form.plan,
        contact_email: form.contactEmail.trim(),
        owner_name: form.ownerName.trim(),
        owner_email: form.ownerEmail.trim(),
      }),
    onSuccess: (result) => {
      toast.push(`${result.tenant.name} created — provision it to activate the owner`)
      setCreateOpen(false)
      setForm(emptyForm)
      setSlugEdited(false)
      setCredential({
        tenantName: result.tenant.name,
        email: result.owner_email,
        password: result.temporary_password,
      })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not create the tenant', 'error'),
  })

  const provision = useMutation({
    mutationFn: (tenantId: number) => tenantsApi.provision(tenantId),
    onSuccess: (result) => {
      toast.push(`${result.tenant.name} is now active`)
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not provision the tenant', 'error'),
  })

  const setTenantStatus = useMutation({
    mutationFn: ({ tenantId, next }: { tenantId: number; next: Tenant['status'] }) =>
      tenantsApi.setStatus(tenantId, next),
    onSuccess: (tenant) => {
      toast.push(`${tenant.name} is now ${tenant.status}`)
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) =>
      toast.push(error instanceof Error ? error.message : 'Could not update the tenant', 'error'),
  })

  const copyCredential = async () => {
    if (!credential) return
    try {
      await navigator.clipboard.writeText(
        `CUBE HRMS · ${credential.tenantName}\nOwner email: ${credential.email}\nTemporary password: ${credential.password}`,
      )
      toast.push('Credentials copied to clipboard')
    } catch {
      toast.push('Clipboard access was blocked by the browser', 'error')
    }
  }

  const canCreate =
    form.name.trim().length >= 2 &&
    /^[a-z0-9][a-z0-9-]{1,78}$/.test(form.slug) &&
    form.contactEmail.includes('@') &&
    form.ownerName.trim().length >= 2 &&
    form.ownerEmail.includes('@')

  const stats = allTenants.data
  const activeCount = stats?.items.filter((tenant) => tenant.status === 'active').length ?? 0
  const pendingCount = stats?.items.filter((tenant) => tenant.status === 'pending').length ?? 0
  const employeeTotal =
    stats?.items.reduce((total, tenant) => total + tenant.employee_count, 0) ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform console"
        title="Tenants"
        description="Every customer workspace on CUBE. Create a tenant, provision its defaults, and control access without touching tenant data."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New tenant
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tenant workspaces"
          value={stats?.total ?? '—'}
          hint="Across all plans"
          icon={Building2}
          tone="pine"
        />
        <StatCard label="Active" value={activeCount} hint="Provisioned and in use" icon={CheckCircle2} tone="sage" />
        <StatCard label="Awaiting provisioning" value={pendingCount} hint="Owner login is inactive" icon={KeyRound} tone="gold" />
        <StatCard label="Employees" value={employeeTotal} hint="Active records across tenants" icon={Users} tone="clay" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search by tenant name or slug"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search tenants"
            />
          </div>
          <Select
            aria-label="Filter tenants by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full sm:w-48"
            placeholder="All statuses"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {tenants.isLoading ? (
        <PageSkeleton />
      ) : tenants.isError ? (
        <ErrorState
          title="Tenants unavailable"
          message="The tenant directory could not be loaded."
          onRetry={() => void tenants.refetch()}
        />
      ) : tenants.data && tenants.data.items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.data.items.map((tenant) => (
            <Card key={tenant.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-on-background font-display text-[15px] font-semibold text-primary-light">
                    {tenant.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[17px] font-medium text-on-background">
                      {tenant.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-text-muted">{tenant.slug}</p>
                  </div>
                </div>
                <StatusBadge status={tenant.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={planTone[tenant.plan] ?? 'neutral'} dot={false}>
                  {tenant.plan} plan
                </Badge>
                <Badge tone="neutral" dot={false}>
                  {tenant.employee_count} employee{tenant.employee_count === 1 ? '' : 's'}
                </Badge>
                <Badge tone="neutral" dot={false}>
                  Since {formatDate(tenant.created_at, { month: 'short', year: 'numeric' })}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-on-background/10 pt-3">
                <p className="truncate text-[11px] text-text-muted">
                  {tenant.contact_email ?? 'No contact email'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => setSelectedId(tenant.id)}>
                  Manage
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Building2}
            title={search || status ? 'No tenants match those filters' : 'No tenants yet'}
            description={
              search || status
                ? 'Try a broader search or a different status.'
                : 'Create the first customer workspace to begin onboarding.'
            }
            action={
              search || status ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('')
                    setStatus('')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>New tenant</Button>
              )
            }
          />
        </Card>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a tenant"
        description="The owner account stays inactive until the tenant is provisioned."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="tenant-create-form"
              loading={create.isPending}
              disabled={!canCreate}
            >
              Create tenant
            </Button>
          </>
        }
      >
        <form
          id="tenant-create-form"
          className="space-y-5"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (canCreate) create.mutate()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="tenantName" required>
              <Input
                id="tenantName"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: slugEdited
                      ? current.slug
                      : name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                          .slice(0, 60),
                  }))
                }}
                placeholder="Gamma Logistics"
              />
            </Field>
            <Field
              label="Workspace slug"
              htmlFor="tenantSlug"
              required
              hint="Lowercase letters, numbers, and hyphens. Permanent."
            >
              <Input
                id="tenantSlug"
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true)
                  setForm({ ...form, slug: event.target.value.toLowerCase() })
                }}
                placeholder="gamma-logistics"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan" htmlFor="tenantPlan">
              <Select
                id="tenantPlan"
                value={form.plan}
                onChange={(event) =>
                  setForm({ ...form, plan: event.target.value as CreateForm['plan'] })
                }
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="scale">Scale</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </Field>
            <Field label="Contact email" htmlFor="tenantContact" required>
              <Input
                id="tenantContact"
                type="email"
                value={form.contactEmail}
                onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                placeholder="ops@gamma.example"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-on-background/10 bg-surface/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Owner account
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Owner name" htmlFor="tenantOwner" required>
                <Input
                  id="tenantOwner"
                  value={form.ownerName}
                  onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
                  placeholder="Gita Verma"
                />
              </Field>
              <Field label="Owner email" htmlFor="tenantOwnerEmail" required>
                <Input
                  id="tenantOwnerEmail"
                  type="email"
                  value={form.ownerEmail}
                  onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })}
                  placeholder="gita@gamma.example"
                />
              </Field>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
              The owner receives the HR administrator role. A temporary password is generated and
              shown once after creation.
            </p>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(credential)}
        onClose={() => setCredential(null)}
        title="Owner credentials"
        description="Shown once. Provision the tenant, then send these credentials to the owner over a secure channel."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCredential(null)}>
              Done
            </Button>
            <Button onClick={() => void copyCredential()}>
              <Copy className="size-3.5" aria-hidden />
              Copy credentials
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-on-background/10 bg-surface p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
              Workspace
            </p>
            <p className="mt-1 text-[13px] font-semibold text-on-background">{credential?.tenantName}</p>
          </div>
          <div className="rounded-xl border border-on-background/10 bg-surface p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
              Owner email
            </p>
            <p className="mt-1 break-all text-[13px] font-semibold text-on-background">
              {credential?.email}
            </p>
          </div>
          <div className="rounded-xl border border-gold-200 bg-primary-light/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Temporary password
            </p>
            <p className="numeric mt-1 font-mono text-[15px] font-semibold text-on-background">
              {credential?.password}
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={detail.data?.name ?? 'Tenant details'}
        description={detail.data ? `${detail.data.slug} · ${detail.data.plan} plan` : undefined}
        size="md"
        footer={
          detail.data ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Close
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {detail.data.status === 'pending' ? (
                  <Button
                    loading={provision.isPending}
                    onClick={() => provision.mutate(detail.data!.id)}
                  >
                    <ShieldCheck className="size-4" aria-hidden />
                    Provision tenant
                  </Button>
                ) : null}
                {detail.data.status === 'active' ? (
                  <Button
                    variant="secondary"
                    loading={
                      setTenantStatus.isPending &&
                      setTenantStatus.variables?.next === 'suspended'
                    }
                    onClick={() =>
                      setTenantStatus.mutate({ tenantId: detail.data!.id, next: 'suspended' })
                    }
                  >
                    <Power className="size-4" aria-hidden />
                    Suspend
                  </Button>
                ) : null}
                {detail.data.status === 'suspended' ? (
                  <Button
                    loading={
                      setTenantStatus.isPending && setTenantStatus.variables?.next === 'active'
                    }
                    onClick={() =>
                      setTenantStatus.mutate({ tenantId: detail.data!.id, next: 'active' })
                    }
                  >
                    <CheckCircle2 className="size-4" aria-hidden />
                    Reactivate
                  </Button>
                ) : null}
                {detail.data.status !== 'cancelled' ? (
                  <Button variant="ghost" className="text-error" onClick={() => setCancelTarget(detail.data ?? null)}>
                    Cancel tenant
                  </Button>
                ) : null}
              </div>
            </div>
          ) : undefined
        }
      >
        {detail.isLoading ? (
          <p className="py-8 text-center text-[13px] text-text-muted">Loading tenant…</p>
        ) : detail.isError || !detail.data ? (
          <ErrorState
            title="Tenant unavailable"
            message="This tenant could not be loaded."
            onRetry={() => void detail.refetch()}
          />
        ) : (
          <TenantDetailView tenant={detail.data} />
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this tenant?"
        description={
          cancelTarget
            ? `${cancelTarget.name} will be marked cancelled and can no longer be reactivated. Its data remains in place for now.`
            : ''
        }
        confirmLabel="Cancel tenant"
        tone="danger"
        loading={setTenantStatus.isPending}
        onConfirm={() =>
          cancelTarget
            ? setTenantStatus.mutate({ tenantId: cancelTarget.id, next: 'cancelled' })
            : undefined
        }
      />
    </div>
  )
}

function TenantDetailView({ tenant }: { tenant: TenantDetail }) {
  const rows = [
    { label: 'Status', value: <StatusBadge status={tenant.status} /> },
    { label: 'Plan', value: <Badge tone={planTone[tenant.plan] ?? 'neutral'}>{tenant.plan}</Badge> },
    { label: 'Employees', value: `${tenant.employee_count} active` },
    { label: 'Pending leave requests', value: String(tenant.pending_leave_requests) },
    { label: 'Owner', value: tenant.owner_name ?? 'No owner on record' },
    { label: 'Owner email', value: tenant.owner_email ?? '—' },
    { label: 'Contact email', value: tenant.contact_email ?? '—' },
    { label: 'Created', value: formatDate(tenant.created_at) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-on-background/10 bg-surface p-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-on-background font-display text-lg font-semibold text-primary-light">
          {tenant.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg text-on-background">{tenant.name}</p>
          <p className="truncate font-mono text-[10px] text-text-muted">
            {tenant.slug}
            {tenant.domain ? ` · ${tenant.domain}` : ''}
          </p>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-on-background/10 pb-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
              {row.label}
            </dt>
            <dd className="mt-1 text-[13px] font-medium text-on-background">{row.value}</dd>
          </div>
        ))}
      </dl>

      {tenant.status === 'pending' ? (
        <p className="rounded-xl border border-gold-200 bg-primary-light/50 px-3.5 py-2.5 text-[11px] leading-relaxed text-primary">
          Provisioning activates the owner account and seeds default departments, designations, and
          leave types. The owner can sign in immediately afterwards.
        </p>
      ) : null}
    </div>
  )
}
