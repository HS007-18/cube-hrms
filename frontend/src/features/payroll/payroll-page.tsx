import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronLeft, Eye, Calculator, Loader2, DollarSign } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/format'
import { payrollApi } from './api'
import type { Payroll, PayrollDetail, PayrollItem, CreatePayrollPayload, CreatePayrollItemPayload } from './types'

type View = 'list' | 'detail'
type PayrollStatus = 'draft' | 'processing' | 'completed' | 'cancelled'

const statusColors: Record<PayrollStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  draft: 'default',
  processing: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
}

export function PayrollPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('list')
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollDetail | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isItemOpen, setIsItemOpen] = useState(false)
  const [itemPayrollId, setItemPayrollId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'all'>('all')

  const isHrAdmin = user?.role === 'hr_admin'

  const { data: payrolls = [], isLoading, error } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollApi.list(),
  })

  const createPayroll = useMutation({
    mutationFn: (payload: CreatePayrollPayload) => payrollApi.create(payload),
    onSuccess: () => {
      toast.push('Payroll created successfully')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      setIsCreateOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not create payroll', 'error'),
  })

  const addItem = useMutation({
    mutationFn: ({ payrollId, payload }: { payrollId: number; payload: CreatePayrollItemPayload }) =>
      payrollApi.addItem(payrollId, payload),
    onSuccess: () => {
      toast.push('Item added')
      if (selectedPayroll) queryClient.invalidateQueries({ queryKey: ['payroll', selectedPayroll.id] })
      setIsItemOpen(false)
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not add item', 'error'),
  })

  const processPayroll = useMutation({
    mutationFn: (payrollId: number) => payrollApi.process(payrollId),
    onSuccess: () => {
      toast.push('Payroll processed successfully')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      if (selectedPayroll) queryClient.invalidateQueries({ queryKey: ['payroll', selectedPayroll.id] })
    },
    onError: (error) => toast.push(error instanceof Error ? error.message : 'Could not process payroll', 'error'),
  })

  const filteredPayrolls = payrolls.filter((p) => {
    const matchesSearch =
      p.id.toString().includes(search) ||
      p.period_start.includes(search) ||
      p.period_end.includes(search)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createPayroll.mutate({
      period_start: formData.get('period_start') as string,
      period_end: formData.get('period_end') as string,
      notes: (formData.get('notes') as string) || undefined,
    })
  }

  const handleAddItem = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!itemPayrollId) return
    const formData = new FormData(e.currentTarget)
    addItem.mutate({
      payrollId: itemPayrollId,
      payload: {
        employee_id: Number(formData.get('employee_id')),
        name: formData.get('name') as string,
        type: formData.get('type') as 'earning' | 'deduction',
        amount: formData.get('amount') as string,
        is_taxable: formData.get('is_taxable') === 'on',
        display_order: Number(formData.get('display_order')) || 0,
      },
    })
  }

return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Manage payroll runs, payslips, and salary structures"
        action={
          isHrAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Payroll Run
            </Button>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Search payrolls..."
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
              <Select.Item value="draft">Draft</Select.Item>
              <Select.Item value="processing">Processing</Select.Item>
              <Select.Item value="completed">Completed</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {view === 'list' && (
          <>
            {error ? (
              <ErrorState message={error instanceof Error ? error.message : 'Failed to load payrolls'} />
            ) : isLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading payrolls...</p>
                </div>
              </Card>
            ) : filteredPayrolls.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No payrolls found"
                description={isHrAdmin ? 'Create your first payroll run to get started' : 'No payrolls available'}
                action={
                  isHrAdmin && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Payroll Run
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
                      <TableCell>Period</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell className="text-right">Items</TableCell>
                      <TableCell className="text-right">Total</TableCell>
                      <TableCell>Created</TableCell>
                      {isHrAdmin && <TableCell className="w-40">Actions</TableCell>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrolls.map((payroll) => (
                      <TableRow key={payroll.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-muted-foreground">{payroll.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{formatDate(payroll.period_start)} - {formatDate(payroll.period_end)}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            variant={statusColors[payroll.status as PayrollStatus]}
                            dot
                          >
                            {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {payroll.items?.length || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {payroll.items?.reduce((sum, item) => {
                            const amount = Number(item.amount)
                            return item.type === 'earning' ? sum + amount : sum - amount
                          }, 0) || 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payroll.created_at.split('T')[0])}
                        </TableCell>
                        {isHrAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  payrollApi.get(payroll.id).then(setSelectedPayroll)
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
                                  setItemPayrollId(payroll.id)
                                  setIsItemOpen(true)
                                }}
                                title="Add Item"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (payroll.status === 'draft') {
                                    processPayroll.mutate(payroll.id)
                                  }
                                }}
                                disabled={payroll.status !== 'draft' || processPayroll.isPending}
                                title={payroll.status === 'draft' ? 'Process Payroll' : 'Only draft payrolls can be processed'}
                              >
                                <Calculator className="h-4 w-4" />
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
          </>
        )}

        {view === 'detail' && selectedPayroll && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Payroll Run #{selectedPayroll.id}
                </h3>
                <p className="text-muted-foreground">
                  {formatDate(selectedPayroll.period_start)} - {formatDate(selectedPayroll.period_end)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={statusColors[selectedPayroll.status as PayrollStatus]} dot>
                  {selectedPayroll.status.charAt(0).toUpperCase() + selectedPayroll.status.slice(1)}
                </StatusBadge>
                <Button variant="ghost" size="icon" onClick={() => setView('list')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPayroll.status === 'draft' && isHrAdmin && (
                <div className="mb-4 flex gap-2">
                  <Button onClick={() => processPayroll.mutate(selectedPayroll.id)} disabled={processPayroll.isPending}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Process Payroll
                  </Button>
                  <Button variant="outline" onClick={() => { setItemPayrollId(selectedPayroll.id); setIsItemOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-primary/20">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          selectedPayroll.items
                            ?.filter((i) => i.type === 'earning')
                            .reduce((sum, i) => sum + Number(i.amount), 0) || 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(
                          selectedPayroll.items
                            ?.filter((i) => i.type === 'deduction')
                            .reduce((sum, i) => sum + Number(i.amount), 0) || 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Net Pay</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          selectedPayroll.items?.reduce((sum, i) => {
                            const amount = Number(i.amount)
                            return i.type === 'earning' ? sum + amount : sum - amount
                          }, 0) || 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Payroll Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell className="text-right">Amount</TableCell>
                        <TableCell>Taxable</TableCell>
                        <TableCell>Order</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayroll.items?.sort((a, b) => a.display_order - b.display_order).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <StatusBadge variant={item.type === 'earning' ? 'success' : 'destructive'} dot>
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.type === 'earning' ? '+' : '-'}{formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>{item.is_taxable ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.display_order}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payroll Run</DialogTitle>
            <DialogDescription>
              Define the pay period and create a new payroll run
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Period Start"
                name="period_start"
                type="date"
                required
              />
              <Field
                label="Period End"
                name="period_end"
                type="date"
                required
              />
            </div>
            <Field label="Notes" name="notes" type="textarea" rows={3} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPayroll.isPending}>
                {createPayroll.isPending ? 'Creating...' : 'Create Payroll'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payroll Item</DialogTitle>
            <DialogDescription>
              Add an earning or deduction to the payroll run
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 p-4">
            <Field label="Employee ID" name="employee_id" type="number" required />
            <Field label="Name" name="name" required />
            <Field
              label="Type"
              name="type"
              type="select"
              options={[
                { value: 'earning', label: 'Earning' },
                { value: 'deduction', label: 'Deduction' },
              ]}
              required
            />
            <Field label="Amount" name="amount" type="number" step="0.01" required />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_taxable" name="is_taxable" defaultChecked />
              <label htmlFor="is_taxable" className="text-sm font-medium">
                Taxable
              </label>
            </div>
            <Field label="Display Order" name="display_order" type="number" defaultValue={0} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addItem.isPending}>
                {addItem.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
