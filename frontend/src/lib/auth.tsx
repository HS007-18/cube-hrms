import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError } from './api'

export interface UserProfile {
  id: number
  email: string
  full_name: string
  role: string
  tenant_id: number | null
  tenant_name: string | null
  is_platform_admin: boolean
  employee_id: number | null
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserProfile
}

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthApi {
  user: UserProfile | null
  status: Status
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        // Tokens live in HttpOnly cookies; /auth/me validates the cookie session.
        const profile = await api<UserProfile>('/auth/me')
        if (cancelled) return
        setUser(profile)
        setStatus('authenticated')
      } catch {
        if (cancelled) return
        ApiError.clearTokens()
        setUser(null)
        setStatus('anonymous')
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      retry: false,
    })
    // Tokens are set as HttpOnly cookies by the backend; no JS-side storage needed.
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', retry: false })
    } finally {
      ApiError.clearTokens()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function isPlatformAdmin(user: UserProfile | null) {
  return Boolean(user?.is_platform_admin)
}

export function hasRole(user: UserProfile | null, ...roles: string[]) {
  return Boolean(user && !user.is_platform_admin && roles.includes(user.role))
}
