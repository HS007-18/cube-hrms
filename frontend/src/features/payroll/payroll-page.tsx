import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, Input as FieldInput } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { payrollApi, Payroll, PayrollItem } from './api';

const statusColors: Record<string, string> = {
  draft: 'bg-[#FEF3C7] text-[#92400E]',
  processing: 'bg-[#DBEAFE] text-[#1D4ED8]',
  completed: 'bg-[#DCFCE7] text-[#15803D]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
};

const statusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-600';

export function PayrollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ period_start: '', period_end: '', notes: '' });

  useEffect(() => {
    loadPayrolls();
  }, []);

  async function loadPayrolls() {
    setLoading(true);
    try {
      const response = await payrollApi.listPayrolls({ limit: 50 });
      setPayrolls(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  }