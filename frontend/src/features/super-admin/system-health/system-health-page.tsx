import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2, RefreshCw } from 'lucide-react'
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
import { systemHealthApi } from './api'
import type { SystemHealthItem, CreateSystemAlertPayload, SystemHealthSummary, SystemMetricItem, SystemAlertItem } from './types'
import type { PaginatedResponse } from '@/features/reports/api'

export function SystemHealthPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'summary' | 'checks' | 'metrics' | 'alerts'>('summary')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isPlatformAdmin = user?.role === 'platform_admin'

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['system-health', 'summary'],
    queryFn: () => systemHealthApi.summary(),
  })

  const { data: checks = { items: [], total: 0, limit: 0, offset: 0 }, isLoading: checksLoading, error: checksError } = useQuery({
    queryKey: ['system-health', 'checks'],
    queryFn: () => systemHealthApi.checks(),
    enabled: view === 'checks',
  })

  const { data: metrics = { items: [], total: 0, limit: 0, offset: 0 }, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['system-health', 'metrics'],
    queryFn: () => systemHealthApi.metrics(),
    enabled: view === 'metrics',
  })

  const { data: alerts = { items: [], total: 0, limit: 0, offset: 0 }, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['system-health', 'alerts'],
    queryFn: () => systemHealthApi.alerts(),
    enabled: view === 'alerts',
  })

  const isPlatformAdmin = user?.role === 'platform_admin'

  const createAlert = useMutation({
    mutationFn: (payload: CreateSystemAlertPayload) => systemHealthApi.createAlert(payload),
    onSuccess: () => {
      toast.push('Alert created successfully')
      queryClient.invalidateQueries({ queryKey: ['system-health', 'alerts'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create alert', 'error'),
  })

  const runChecks = useMutation({
    mutationFn: () => systemHealthApi.runChecks(),
    onSuccess: () => {
      toast.push('Health checks executed')
      queryClient.invalidateQueries({ queryKey: ['system-health'] })
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not run health checks', 'error'),
  })

  const createAlertItem = useMutation({
    mutationFn: (payload: CreateSystemAlertPayload) => systemHealthApi.createAlert(payload),
    onSuccess: () => {
      toast.push('Alert created successfully')
      queryClient.invalidateQueries({ queryKey: ['system-health', 'alerts'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create alert', 'error'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health Monitoring"
        description="Monitor system health and performance metrics"
        actions={
          isPlatformAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => runChecks.mutate()} disabled={runChecks.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Health Checks
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex gap-2 border-b pb-2">
          {['summary', 'checks', 'metrics', 'alerts'].map((tab) => (
            <Button
              key={tab}
              variant={view === tab ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {view === 'summary' && (
          <div>
            {summaryError ? (
              <div className="text-destructive">{summaryError instanceof Error ? summaryError.message : 'Failed to load summary'}</div>
            ) : summaryLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading system health summary...</p>
                </div>
              </Card>
            ) : summary ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader title="Overall Status" />
                  <CardContent>
                    <div className="text-3xl font-bold text-center">
                      <StatusBadge status={summary.overall_status} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Total Checks" />
                  <CardContent>
                    <div className="text-3xl font-bold text-center">{summary.total_checks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Healthy" />
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 text-center">{summary.healthy_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Issues" />
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 text-center">{summary.unhealthy_count + summary.degraded_count}</div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        )}

        {view === 'checks' && (
          <div>
            {checksError ? (
              <div className="text-destructive">{checksError instanceof Error ? checksError.message : 'Failed to load checks'}</div>
            ) : checksLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading health checks...</p>
                </div>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="w-12">ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Component</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Checked</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {('items' in checks ? checks.items : checks).map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                        <TableCell>{item.check_type}</TableCell>
                        <TableCell>{item.component}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>{item.message || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.checked_at.split('T')[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {view === 'metrics' && (
          <div>
            {metricsError ? (
              <div className="text-destructive">{metricsError instanceof Error ? metricsError.message : 'Failed to load metrics'}</div>
            ) : metricsLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading metrics...</p>
                </div>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="w-12">ID</TableCell>
                      <TableCell>Metric</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Recorded</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {('items' in metrics ? metrics.items : metrics).map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                        <TableCell className="font-medium">{item.metric_name}</TableCell>
                        <TableCell className="font-mono">{item.value}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.recorded_at.split('T')[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {view === 'alerts' && (
          <div>
            {alertsError ? (
              <div className="text-destructive">{alertsError instanceof Error ? alertsError.message : 'Failed to load alerts'}</div>
            ) : alertsLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading alerts...</p>
                </div>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="w-12">ID</TableCell>
                      <TableCell>Check</TableCell>
                      <TableCell>Component</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Resolved</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {('items' in alerts ? alerts.items : alerts).map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                        <TableCell>{item.check_type}</TableCell>
                        <TableCell>{item.component}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.severity} />
                        </TableCell>
                        <TableCell>{item.message}</TableCell>
                        <TableCell>{item.is_resolved ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.created_at.split('T')[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Alert" description="Create a new system alert">
        <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); createAlertItem.mutate({ check_type: formData.get('check_type') as string, component: formData.get('component') as string, severity: formData.get('severity') as 'info' | 'warning' | 'critical', message: formData.get('message') as string }); }} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check Type" required>
              <input
                name="check_type"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
            <Field label="Component" required>
              <input
                name="component"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 h-10"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Severity" required>
              <Select name="severity" required>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>
          </div>
          <Field label="Message" required>
            <textarea
              name="message"
              rows={3}
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#111D36] transition-all duration-150 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-cube-blue-electric focus:bg-white focus:outline-none focus:ring-3 focus:ring-cube-blue-electric/15 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 py-2.5"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createAlertItem.isPending}>{createAlertItem.isPending ? 'Creating...' : 'Create Alert'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
