import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Pill, Settings, PlusCircle, History,
  Menu, X, ShieldCheck, ClockArrowUp, CalendarDays, Stethoscope, ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function BottomNav() {
  const { isAdmin } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const moreItems = [
    { to: '/stock-days',    icon: CalendarDays, label: 'Days Remaining' },
    { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor Visits' },
    { to: '/edit-logs',     icon: ScrollText,   label: 'Edit Logs' },
    ...(isAdmin ? [
      { to: '/retroactive', icon: ClockArrowUp, label: 'Edit Past Dose' },
      { to: '/admin',       icon: ShieldCheck,  label: 'Admin Panel' },
    ] : []),
    { to: '/settings',      icon: Settings,     label: 'Settings' },
  ]

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 bg-black/20"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-14 left-0 right-0 bg-white border-t border-warm-100 rounded-t-2xl shadow-xl p-4 pb-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-warm-500 hover:bg-warm-50 hover:text-warm-700'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="text-center leading-tight">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-100 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch max-w-lg mx-auto">
          {/* Home */}
          <NavLink
            to="/" end
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
              isActive ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {({ isActive }) => <><Home size={20} strokeWidth={isActive ? 2.5 : 1.8} /><span>Home</span></>}
          </NavLink>

          {/* Meds */}
          <NavLink
            to="/medicines"
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
              isActive ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {({ isActive }) => <><Pill size={20} strokeWidth={isActive ? 2.5 : 1.8} /><span>Meds</span></>}
          </NavLink>

          {/* Center Log Dose */}
          <NavLink
            to="/log-dose"
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-colors min-h-[56px]',
              isActive ? 'text-brand-600' : 'text-brand-500 hover:text-brand-700'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all',
                  isActive ? 'bg-brand-600 scale-105' : 'bg-brand-500 hover:bg-brand-600'
                )}>
                  <PlusCircle size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className={isActive ? 'text-brand-600' : 'text-brand-500'}>Log</span>
              </>
            )}
          </NavLink>

          {/* History */}
          <NavLink
            to="/history"
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
              isActive ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {({ isActive }) => <><History size={20} strokeWidth={isActive ? 2.5 : 1.8} /><span>History</span></>}
          </NavLink>

          {/* More */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
              showMore ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {showMore
              ? <><X size={20} strokeWidth={2.5} /><span>Close</span></>
              : <><Menu size={20} strokeWidth={1.8} /><span>More</span></>
            }
          </button>
        </div>
      </nav>
    </>
  )
}
