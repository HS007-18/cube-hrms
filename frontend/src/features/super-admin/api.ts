const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface TenantOut {
  id: number;
  name: string;
  slug: string;
  status: string;
  plan: string;
  contact_email: string | null;
  domain: string | null;
  employee_count: number;
  user_count: number;
  created_at: string;
}

export interface TenantListResponse {
  items: TenantOut[];
  total: number;
  limit: number;
  offset: number;
}

export interface TenantCreate {
  name: string;
  slug: string;
  plan?: string;
  contact_email: string;
  domain?: string;
}

export interface TenantStatusUpdate {
  status: string;
}

export interface CreateTenantResult {
  tenant: TenantOut;
  owner_email: string;
  temporary_password: string;
}

export interface ProvisionResult {
  tenant: TenantOut;
  owner_email: string;
  temporary_password: string | null;
}

export interface TenantDetail {
  id: number;
  name: string;
  slug: string;
  status: string;
  plan: string;
  contact_email: string | null;
  domain: string | null;
  employee_count: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const superAdminApi = {
  listTenants: (params?: {
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.status) search.set('status', params.status);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    return request<TenantListResponse>(`/tenants?${search}`);
  },

  getTenant: (tenantId: number) =>
    request<TenantDetail>(`/tenants/${tenantId}`),

  createTenant: (payload: TenantCreate) =>
    request<CreateTenantResult>('/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  provisionTenant: (tenantId: number) =>
    request<ProvisionResult>(`/tenants/${tenantId}/provision`, {
      method: 'POST',
    }),

  updateTenantStatus: (tenantId: number, status: string) =>
    request<TenantOut>(`/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};