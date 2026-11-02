import { X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Sidebar, SidebarContent } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-pine-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[280px] animate-rise shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-ivory-100/60 transition hover:bg-white/8 hover:text-ivory-50"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[264px]">
        <Topbar user={user} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
          <div key={location.pathname} className="animate-rise">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
