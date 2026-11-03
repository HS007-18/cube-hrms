import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/lib/auth'
import { LoginPage } from './login-page'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const validLoginResponse = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'priya@aurora.example',
    full_name: 'Priya Sharma',
    role: 'hr_admin',
    is_platform_admin: false,
    tenant_id: 1,
    tenant_name: 'Aurora Textiles',
    employee_id: 1,
  },
}

describe('LoginPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the sign-in form without demo credentials', () => {
    renderLogin()

    expect(
      screen.getByRole('heading', { name: /sign in to your workspace/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    // Demo credentials were removed; the page must not leak seed accounts.
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Cube@Admin#2026')).not.toBeInTheDocument()
    expect(screen.queryByText('Aurora@2026')).not.toBeInTheDocument()
  })

  // The AuthProvider bootstrap calls /auth/me on mount; it must fail so the
  // login form stays visible, and each call needs its own Response body.
  function mockFetch(routes: Record<string, () => Response>) {
    return vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      const match = Object.entries(routes).find(([path]) => url.includes(path))
      if (!match) {
        return Promise.resolve(
          new Response(JSON.stringify({ detail: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
      return Promise.resolve(match[1]())
    })
  }

  const unauthorized = (detail: string) => () =>
    new Response(JSON.stringify({ detail }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

  it('signs in a tenant user and navigates to the dashboard', async () => {
    const fetchMock = mockFetch({
      '/auth/me': unauthorized('Not authenticated'),
      '/auth/login': () =>
        new Response(JSON.stringify(validLoginResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/work email/i), 'priya@aurora.example')
    await user.type(screen.getByLabelText(/^password/i), 'Aurora@2026')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    // Wait for the login POST; the page then navigates away to /dashboard.
    await vi.waitFor(() => {
      const loginCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/auth/login'),
      )
      expect(loginCalls.length).toBeGreaterThan(0)
    })
    const loginCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/auth/login'),
    )
    expect(String(loginCall?.[0])).toContain('/auth/login')
    const body = JSON.parse(String(loginCall?.[1]?.body))
    expect(body).toEqual({ email: 'priya@aurora.example', password: 'Aurora@2026' })
  })

  it('shows the server message when credentials are rejected', async () => {
    const fetchMock = mockFetch({
      '/auth/me': unauthorized('Not authenticated'),
      '/auth/login': unauthorized('Incorrect email or password'),
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/work email/i), 'priya@aurora.example')
    await user.type(screen.getByLabelText(/^password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect email or password',
    )
    const loginCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/auth/login'),
    )
    expect(loginCalls).toHaveLength(1)
  })
})
