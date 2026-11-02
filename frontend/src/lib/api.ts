const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  // Tokens are stored in HttpOnly cookies set by the backend — not in
  // sessionStorage — so XSS cannot exfiltrate bearer tokens.
  static clearTokens() {
    // No-op: tokens live in HttpOnly cookies, not JS-accessible storage.
  }
}

function errorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : 'Invalid value',
        )
        .join('; ')
    }
  }
  return 'Something went wrong. Please try again.'
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          return false
        }
        try {
          await response.json()
          return true
        } catch {
          return false
        }
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  retry?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, retry = true } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // credentials: 'include' ensures HttpOnly cookies are sent with every request.
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 401 && retry && !path.startsWith('/auth/login')) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return api<T>(path, { ...options, retry: false })
    }
    ApiError.clearTokens()
  }

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      try {
        const text = await response.text()
        payload = text ? JSON.parse(text) : null
      } catch {
        // Non-JSON error body.
      }
    }
    throw new ApiError(response.status, errorMessage(payload))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}
