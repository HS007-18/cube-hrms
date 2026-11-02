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
    <div className="flex h-full flex-col bg-cube-on-background text-cube-on-background">
      <div className="flex items-center gap-3 px-6 pb-5 pt-6">
        <BrandMark />
        <BrandWordmark />
      </div>

      <div className="mx-6 mb-4 h-px bg-cube-surface/10" />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {visibleSections(user).map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-cube-primary-light">
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
                        ? 'bg-cube-surface/10 text-cube-on-background'
                        : 'text-cube-on-background/60 hover:bg-cube-surface-hover hover:text-cube-on-background',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cube-primary-light transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                      <item.icon
                        className={cn(
                          'size-[17px] transition-colors',
                          isActive ? 'text-cube-primary-light' : 'text-cube-on-background/60 group-hover:text-cube-on-background/75',
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

      <div className="border-t border-cube-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-cube-on-background">
              {user.full_name}
            </p>
            <p className="truncate text-[10px] text-cube-text-muted">
              {user.tenant_name ?? 'CUBE platform'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-2 text-cube-on-background/60 transition hover:bg-cube-surface-hover/6 hover:text-cube-on-background"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <p className="mt-2 px-2 text-[9px] uppercase tracking-[0.2em] text-cube-on-background/45">
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
