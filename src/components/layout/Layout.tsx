import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Pill, History, Stethoscope, Settings, Heart, PlusCircle,
  CalendarDays, ShieldCheck, ClockArrowUp, LogOut, ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BottomNav } from './BottomNav'
import { useAuth } from '@/context/AuthContext'
import { MemojiAvatar } from '@/components/common/MemojiAvatar'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  highlight?: boolean
  adminOnly?: boolean
  color?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',              icon: Home,         label: 'Home',           color: '#FF9F0A' },
  { to: '/medicines',     icon: Pill,         label: 'Medicines',      color: '#0A84FF' },
  { to: '/log-dose',      icon: PlusCircle,   label: 'Log a Dose',     highlight: true },
  { to: '/stock-days',    icon: CalendarDays, label: 'Days Remaining', color: '#34C759' },
  { to: '/history',       icon: History,      label: 'History',        color: '#AF52DE' },
  { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor Visits',  color: '#32ADE6' },
  { to: '/retroactive',   icon: ClockArrowUp, label: 'Edit Past Dose', adminOnly: true, color: '#FF9F0A' },
  { to: '/admin',         icon: ShieldCheck,  label: 'Admin Panel',    adminOnly: true, color: '#D4A843' },
  { to: '/edit-logs',     icon: ScrollText,   label: 'Edit Logs',      color: '#6C6C70' },
  { to: '/settings',      icon: Settings,     label: 'Settings',       color: '#8E8E93' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth()
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  const displayName = profile?.display_name ?? profile?.caregiver_name ?? 'You'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2F2F7' }}>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-40"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E8C158 0%, #D4A843 60%, #B45309 100%)' }}
            >
              <Heart size={18} className="text-white animate-float" fill="rgba(255,255,255,0.4)" />
            </div>
            <div>
              <p className="font-black text-warm-900 leading-tight text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                {profile?.patient_name ?? 'Dr Nikkie'}'s Meds
              </p>
              <p className="text-[11px] text-warm-500 font-medium">Medicine Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label, highlight, adminOnly, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'text-warm-900 font-semibold'
                    : highlight
                      ? 'text-white hover:opacity-90'
                      : 'text-warm-600 hover:bg-black/5 hover:text-warm-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.2)' }} />
                  )}
                  {highlight && !isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #E8C158, #D4A843)' }} />
                  )}
                  {highlight && isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #E8C158, #D4A843)', boxShadow: '0 2px 12px rgba(212,168,67,0.4)' }} />
                  )}
                  {/* Left gold active bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-full"
                      style={{ background: '#D4A843' }} />
                  )}
                  {/* Apple-style icon chip */}
                  <div
                    className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: highlight
                        ? 'rgba(255,255,255,0.3)'
                        : isActive
                          ? (color ? `${color}22` : 'rgba(212,168,67,0.15)')
                          : (color ? `${color}15` : 'rgba(0,0,0,0.05)'),
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={isActive || highlight ? 2.2 : 1.8}
                      style={{ color: highlight ? '#fff' : isActive ? (color ?? '#D4A843') : (color ?? '#8E8E93') }}
                    />
                  </div>
                  <span className="relative z-10 tracking-[0.01em]">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <MemojiAvatar seed={displayName} size={36} rounded="xl" />
              <span className="online-dot" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-warm-900 truncate leading-tight">{displayName}</p>
              {isAdmin ? (
                <p className="text-[10px] font-semibold flex items-center gap-1 mt-0.5" style={{ color: '#B45309' }}>
                  <ShieldCheck size={9} /> Admin
                </p>
              ) : (
                <p className="text-[10px] text-warm-400 mt-0.5">Family member</p>
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-warm-400 transition-all duration-150"
              style={{ }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF453A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,69,58,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; (e.currentTarget as HTMLElement).style.background = '' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="md:ml-60 pb-24 md:pb-8 min-h-screen">
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
