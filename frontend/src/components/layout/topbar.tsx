import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import type { UserProfile } from '@/lib/auth'
import { roleLabel } from '@/lib/format'

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/employees': 'People',
  '/structure': 'Structure',
  '/attendance': 'Attendance',
  '/leave': 'Leave',
  '/tenants': 'Tenants',
  '/profile': 'My profile',
}

export function Topbar({
  user,
  onMenu,
}: {
  user: UserProfile
  onMenu: () => void
}) {
  const location = useLocation()
  const title = titles[location.pathname] ?? 'Workspace'
  const [today] = useState(() =>
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date()),
  )

  return (
    <header className="sticky top-0 z-20 border-b border-on-background/10 bg-ivory-100/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl p-2 text-pine-800 transition hover:bg-on-background/6 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {user.is_platform_admin ? 'Platform console' : (user.tenant_name ?? 'Workspace')}
          </p>
          <p className="truncate text-[13px] font-semibold text-on-background">{title}</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[12px] font-medium text-text-muted sm:block">{today}</span>
          <span className="hidden h-6 w-px bg-on-background/10 sm:block" aria-hidden />
          <div className="flex items-center gap-2.5">
            <Avatar name={user.full_name} size="sm" />
            <div className="hidden min-w-0 leading-tight md:block">
              <p className="max-w-[160px] truncate text-[12px] font-semibold text-on-background">
                {user.full_name}
              </p>
              <p className="text-[10px] text-text-muted">{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
