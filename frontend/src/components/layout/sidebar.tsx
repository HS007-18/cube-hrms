import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FolderOpen,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Network,
  ShieldAlert,
  Target,
  UserRound,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
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
      { to: '/dashboard', label: 'Overview', icon: Home, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/employees', label: 'People', icon: Users, roles: ['hr_admin'] },
      { to: '/structure', label: 'Structure', icon: Network, roles: ['hr_admin'] },
      { to: '/attendance', label: 'Attendance', icon: Clock3, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/leave', label: 'Leave', icon: CalendarDays, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/profile', label: 'My Profile', icon: UserRound, roles: ['hr_admin', 'manager', 'employee'] },
    ],
  },
  {
    label: 'HR Operations',
    items: [
      { to: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['hr_admin'] },
      { to: '/recruitment', label: 'Recruitment', icon: Users, roles: ['hr_admin'] },
      { to: '/onboarding', label: 'Onboarding', icon: CheckCircle2, roles: ['hr_admin'] },
      { to: '/offboarding', label: 'Offboarding', icon: LogOut, roles: ['hr_admin'] },
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['hr_admin'] },
      { to: '/documents', label: 'Documents', icon: FolderOpen, roles: ['hr_admin'] },
      { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/holidays', label: 'Holidays', icon: CalendarDays, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/goals', label: 'Goals', icon: Target, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/support', label: 'Support', icon: HelpCircle, roles: ['hr_admin', 'manager', 'employee'] },
      { to: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['hr_admin', 'manager', 'employee'] },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/tenants', label: 'Tenants', icon: Building2, platformOnly: true },
      { to: '/subscriptions', label: 'Subscriptions', icon: DollarSign, platformOnly: true },
      { to: '/tenant-analytics', label: 'Tenant Analytics', icon: BarChart3, platformOnly: true },
      { to: '/platform-audit', label: 'Platform Audit', icon: ShieldAlert, platformOnly: true },
      { to: '/system-health', label: 'System Health', icon: Activity, platformOnly: true },
    ],
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
    <div className="relative flex h-full flex-col bg-cube-navy-primary text-white select-none overflow-hidden">
      {/* Subtle Background Isometric Cube Watermark matching reference */}
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-64 opacity-[0.06] mix-blend-screen" aria-hidden>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
          <polygon points="50,5 90,27 50,50 10,27" stroke="#08D9F5" strokeWidth="1.5" />
          <polygon points="10,27 50,50 50,95 10,72" stroke="#087FF5" strokeWidth="1.5" fill="rgba(8,127,245,0.05)" />
          <polygon points="50,50 90,27 90,72 50,95" stroke="#7957F5" strokeWidth="1.5" fill="rgba(121,87,245,0.05)" />
        </svg>
      </div>

      {/* Brand Header with Official Logo */}
      <div className="flex items-center gap-3 px-6 pb-4 pt-6">
        <img
          src="/cubeai-logo-dark.png"
          alt="CubeAI Solutions"
          className="h-10 w-auto object-contain"
        />
      </div>

      <div className="mx-6 mb-3 h-px bg-white/10" />

      {/* Navigation Links */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 pb-4" aria-label="Main navigation">
        {visibleSections(user).map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748B]">
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
                      'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-sans text-[14px] font-medium leading-snug transition-all duration-150',
                      isActive
                        ? 'bg-cube-blue-electric text-white font-semibold shadow-[0_4px_16px_rgba(8,127,245,0.35)]'
                        : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'size-[18px] transition-colors',
                          isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-white',
                        )}
                        aria-hidden
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer section matching reference screenshot */}
      <div className="border-t border-white/10 px-4 py-3 bg-cube-navy-primary/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar name={user.full_name} size="sm" className="bg-[#E2E8F0] text-[#031B32] font-bold ring-2 ring-white/10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {user.full_name}
            </p>
            <p className="truncate text-[11px] text-[#94A3B8]">
              {roleLabel(user.role)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-2 text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <p className="px-2 pt-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {roleLabel(user.role)} · V0.1
        </p>
      </div>
    </div>
  )
}

export function Sidebar({ user }: { user: UserProfile }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[264px] lg:block z-30">
      <SidebarContent user={user} />
    </aside>
  )
}
