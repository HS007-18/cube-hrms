import {
  Building2,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  LogOut,
  Network,
  UserRound,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { BrandMark, BrandWordmark } from '@/components/layout/brand'
import { useAuth, type UserProfile } from '@/lib/auth'
import { cn } from '@/lib/cn'
import { roleLabel } from '@/lib/format'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: string[]
  platformOnly?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/employees', label: 'People', icon: Users, roles: ['hr_admin'] },
      { to: '/structure', label: 'Structure', icon: Network, roles: ['hr_admin'] },
      { to: '/attendance', label: 'Attendance', icon: Clock3, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/leave', label: 'Leave', icon: CalendarDays, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/profile', label: 'My profile', icon: UserRound, roles: ['hr_admin', 'manager', 'employee'] },
    ],
  },
  {
    label: 'Platform',
    items: [{ to: '/tenants', label: 'Tenants', icon: Building2, platformOnly: true }],
  },
]

function visibleSections(user: UserProfile) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.platformOnly) return user.is_platform_admin
        if (user.is_platform_admin) return item.to === '/profile'
        return item.roles?.includes(user.role) ?? false
      }),
    }))
    .filter((section) => section.items.length > 0)
}

interface SidebarProps {
  user: UserProfile
  onNavigate?: () => void
}

export function SidebarContent({ user, onNavigate }: SidebarProps) {
  const { logout } = useAuth()

  return (
    <div className="flex h-full flex-col bg-pine-950 text-ivory-100">
      <div className="flex items-center gap-3 px-6 pb-5 pt-6">
        <BrandMark />
        <BrandWordmark />
      </div>

      <div className="mx-6 mb-4 h-px bg-white/8" />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {visibleSections(user).map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-ivory-100/35">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
                      isActive
                        ? 'bg-white/8 text-ivory-50'
                        : 'text-ivory-100/55 hover:bg-white/5 hover:text-ivory-50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                      <item.icon
                        className={cn(
                          'size-[17px] transition-colors',
                          isActive ? 'text-gold-400' : 'text-ivory-100/45 group-hover:text-ivory-100/75',
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-ivory-50">{user.full_name}</p>
            <p className="truncate text-[10px] text-ivory-100/45">
              {user.tenant_name ?? 'CUBE platform'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-2 text-ivory-100/45 transition hover:bg-white/6 hover:text-ivory-50"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <p className="mt-2 px-2 text-[9px] uppercase tracking-[0.2em] text-ivory-100/25">
          {roleLabel(user.role)} · v0.1
        </p>
      </div>
    </div>
  )
}

export function Sidebar({ user }: { user: UserProfile }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">
      <SidebarContent user={user} />
    </aside>
  )
}
