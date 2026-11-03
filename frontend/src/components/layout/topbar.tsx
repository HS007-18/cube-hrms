import { ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  '/profile': 'My Profile',
}

export function Topbar({
  user,
  onMenu,
}: {
  user: UserProfile
  onMenu: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] ?? 'Workspace'
  const [today] = useState(() =>
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date()),
  )

  const orgName = user.is_platform_admin
    ? 'PLATFORM CONSOLE'
    : (user.tenant_name ?? 'AURORA TEXTILES').toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-[#F0F5FF]/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl p-2 text-cube-navy-primary transition hover:bg-black/5 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <p className="text-small-label uppercase tracking-wider text-[#64748B]">
            {orgName}
          </p>
          <p className="truncate font-heading text-[18px] sm:text-[20px] font-semibold text-[#111D36] leading-tight">
            {title}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-[13px] font-medium text-[#64748B] sm:block">
            {today}
          </span>
          <span className="hidden h-5 w-px bg-[#CBD5E1] sm:block" aria-hidden />

          {/* User profile badge matching reference */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 rounded-xl p-1 sm:px-2 sm:py-1.5 transition hover:bg-white/60 text-left"
            title="View Profile"
          >
            <Avatar
              name={user.full_name}
              size="sm"
              className="bg-[#E2E8F0] text-[#031B32] font-bold ring-1 ring-[#CBD5E1]"
            />
            <div className="hidden min-w-0 leading-tight md:block">
              <p className="truncate text-[13px] font-bold text-[#111D36]">
                {user.full_name}
              </p>
              <p className="truncate text-[11px] text-[#64748B]">
                {roleLabel(user.role)}
              </p>
            </div>
            <ChevronDown className="hidden size-3.5 text-[#64748B] md:block" />
          </button>
        </div>
      </div>
    </header>
  )
}
