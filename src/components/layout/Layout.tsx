import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Pill, History, Stethoscope, Settings, Heart, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BottomNav } from './BottomNav'
import { useAuth } from '@/context/AuthContext'

const sidebarItems = [
  { to: '/',              icon: Home,         label: 'Home' },
  { to: '/medicines',     icon: Pill,         label: 'Medicines' },
  { to: '/log-dose',      icon: PlusCircle,   label: 'Log a Dose',   highlight: true },
  { to: '/history',       icon: History,      label: 'History' },
  { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor Visits' },
  { to: '/settings',      icon: Settings,     label: 'Settings' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-warm-200 flex-col z-40">
        <div className="p-5 border-b border-warm-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-warm-800 leading-tight text-sm">
                {profile?.patient_name ?? 'Mom'}'s Meds
              </p>
              <p className="text-xs text-warm-400">Medicine Tracker</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : highlight
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'text-warm-500 hover:bg-warm-50 hover:text-warm-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-warm-100">
          <p className="text-xs text-warm-400">Caregiver: {profile?.caregiver_name ?? 'You'}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-56 pb-20 md:pb-8 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-5">
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
