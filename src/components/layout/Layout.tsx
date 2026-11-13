import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Pill, History, Stethoscope, Settings, Heart, PlusCircle,
  CalendarDays, ShieldCheck, ClockArrowUp, LogOut, User,
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
  { to: '/settings',      icon: Settings,     label: 'Settings' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth()
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-white border-r border-warm-100 flex-col z-40">
        {/* Logo */}
        <div className="p-5 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-200">
              <Heart size={18} className="text-white fill-white/30" />
            </div>
            <div>
              <p className="font-semibold text-warm-800 leading-tight text-sm font-display">
                {profile?.patient_name ?? 'Dr Nikkie'}'s Meds
              </p>
              <p className="text-xs text-warm-400">Medicine Tracker</p>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : highlight
                      ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                      : adminOnly
                        ? 'text-violet-600 hover:bg-violet-50'
                        : 'text-warm-500 hover:bg-warm-50 hover:text-warm-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive || highlight ? 2.2 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-warm-100 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-warm-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-warm-700 truncate">
                {profile?.display_name ?? profile?.caregiver_name ?? 'You'}
              </p>
              {isAdmin && (
                <p className="text-xs text-brand-600 flex items-center gap-1">
                  <ShieldCheck size={10} /> Admin
                </p>
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-60 pb-20 md:pb-8 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-5 lg:px-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
