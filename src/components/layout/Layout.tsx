import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Pill, History, Stethoscope, Settings, Heart, PlusCircle,
  CalendarDays, ShieldCheck, ClockArrowUp, LogOut, ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BottomNav } from './BottomNav'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  highlight?: boolean
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',              icon: Home,         label: 'Home' },
  { to: '/medicines',     icon: Pill,         label: 'Medicines' },
  { to: '/log-dose',      icon: PlusCircle,   label: 'Log a Dose', highlight: true },
  { to: '/stock-days',    icon: CalendarDays, label: 'Days Remaining' },
  { to: '/history',       icon: History,      label: 'History' },
  { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor Visits' },
  { to: '/retroactive',   icon: ClockArrowUp, label: 'Edit Past Dose', adminOnly: true },
  { to: '/admin',         icon: ShieldCheck,  label: 'Admin Panel', adminOnly: true },
  { to: '/edit-logs',     icon: ScrollText,   label: 'Edit Logs' },
  { to: '/settings',      icon: Settings,     label: 'Settings' },
]

function SidebarAvatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="relative flex-shrink-0">
      {/* Animated gradient ring wrapper */}
      <div className="avatar-ring rounded-xl">
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white relative z-10',
            isAdmin
              ? 'bg-gradient-to-br from-brand-500 to-brand-700'
              : 'bg-gradient-to-br from-warm-300 to-warm-400'
          )}
        >
          {initials}
        </div>
      </div>
      {/* Online dot */}
      <span className="online-dot" />
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth()
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  const displayName = profile?.display_name ?? profile?.caregiver_name ?? 'You'

  return (
    <div className="min-h-screen bg-warm-50">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-40"
        style={{ background: 'linear-gradient(180deg, #2b2d31 0%, #232428 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Heart size={18} className="text-white animate-float" fill="rgba(255,255,255,0.3)" />
            </div>
            <div>
              <p className="font-bold text-warm-800 leading-tight text-sm" style={{ fontFamily: 'Inter Tight, Inter, sans-serif' }}>
                {profile?.patient_name ?? 'Dr Nikkie'}'s Meds
              </p>
              <p className="text-[11px] text-warm-400 font-medium tracking-wide">Medicine Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label, highlight, adminOnly }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group overflow-hidden',
                  isActive
                    ? 'text-white font-semibold'
                    : highlight
                      ? 'text-white hover:opacity-90'
                      : adminOnly
                        ? 'text-[#a78bfa] hover:bg-white/5'
                        : 'text-warm-500 hover:bg-white/5 hover:text-warm-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active background */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-brand-500/20" />
                  )}
                  {/* Highlight (Log a Dose) background */}
                  {highlight && !isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600/80 to-brand-500/80" />
                  )}
                  {highlight && isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400" />
                  )}
                  {/* Left active indicator pill */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-brand-400 rounded-r-full shadow-[0_0_6px_rgba(88,101,242,0.6)]" />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={isActive || highlight ? 2.2 : 1.8}
                    className={cn('relative z-10 transition-transform duration-150', isActive && 'scale-110')}
                  />
                  <span className="relative z-10 tracking-[0.01em]">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <SidebarAvatar name={displayName} isAdmin={isAdmin} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-warm-700 truncate leading-tight">{displayName}</p>
              {isAdmin ? (
                <p className="text-[10px] text-brand-400 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={9} /> Admin
                </p>
              ) : (
                <p className="text-[10px] text-warm-400 mt-0.5">Family member</p>
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-warm-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="md:ml-60 pb-20 md:pb-8 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-5 lg:px-6">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
