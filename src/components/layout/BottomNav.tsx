import { useState, useRef } from 'react'
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
    { to: '/stock-days',    icon: CalendarDays, label: 'Days Remaining', color: 'text-blue-400' },
    { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor Visits',  color: 'text-teal-400' },
    { to: '/edit-logs',     icon: ScrollText,   label: 'Edit Logs',      color: 'text-warm-500' },
    ...(isAdmin ? [
      { to: '/retroactive', icon: ClockArrowUp, label: 'Edit Past Dose', color: 'text-amber-400' },
      { to: '/admin',       icon: ShieldCheck,  label: 'Admin Panel',    color: 'text-[#a78bfa]' },
    ] : []),
    { to: '/settings',      icon: Settings,     label: 'Settings',       color: 'text-warm-400' },
  ]

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-[56px] left-0 right-0 rounded-t-2xl p-4 pb-5 animate-slide-up"
            style={{ background: 'linear-gradient(180deg, #36393f 0%, #2b2d31 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-8 h-1 bg-warm-300/30 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map(({ to, icon: Icon, label, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-brand-500/20 text-brand-400'
                      : `${color} hover:bg-white/5 hover:text-warm-700`
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150',
                        isActive ? 'bg-brand-500/25' : 'bg-white/5 group-hover:bg-white/10'
                      )}>
                        <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                      </div>
                      <span className="text-center leading-tight text-[11px]">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'linear-gradient(180deg, #2b2d31 0%, #232428 100%)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch max-w-lg mx-auto">

          {/* Home */}
          <NavLink to="/" end className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[56px] relative',
            isActive ? 'text-white' : 'text-warm-400 hover:text-warm-600'
          )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-brand-500 rounded-full" />}
                <div className={cn('transition-transform duration-200', isActive && 'scale-110')}>
                  <Home size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={isActive ? 'text-brand-400' : ''}>Home</span>
              </>
            )}
          </NavLink>

          {/* Meds */}
          <NavLink to="/medicines" className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[56px] relative',
            isActive ? 'text-white' : 'text-warm-400 hover:text-warm-600'
          )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-brand-500 rounded-full" />}
                <div className={cn('transition-transform duration-200', isActive && 'scale-110')}>
                  <Pill size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={isActive ? 'text-brand-400' : ''}>Meds</span>
              </>
            )}
          </NavLink>

          {/* Centre Log Dose — prominent blurple button */}
          <NavLink
            to="/log-dose"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all duration-200 min-h-[56px]"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 log-glow',
                  isActive
                    ? 'bg-gradient-to-br from-brand-400 to-brand-600 scale-105'
                    : 'bg-gradient-to-br from-brand-500 to-brand-700 hover:scale-105'
                )}
                  style={{ width: 52, height: 52, boxShadow: isActive ? '0 0 20px rgba(88,101,242,0.6)' : undefined }}
                >
                  <PlusCircle size={24} className="text-white" strokeWidth={2.2} />
                </div>
                <span className={cn('text-[10px]', isActive ? 'text-brand-400' : 'text-brand-500')}>Log</span>
              </>
            )}
          </NavLink>

          {/* History */}
          <NavLink to="/history" className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[56px] relative',
            isActive ? 'text-white' : 'text-warm-400 hover:text-warm-600'
          )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-brand-500 rounded-full" />}
                <div className={cn('transition-transform duration-200', isActive && 'scale-110')}>
                  <History size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={isActive ? 'text-brand-400' : ''}>History</span>
              </>
            )}
          </NavLink>

          {/* More */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[56px] relative',
              showMore ? 'text-white' : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {showMore && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-brand-500 rounded-full" />}
            <div className={cn('transition-transform duration-200', showMore && 'rotate-90 scale-110')}>
              {showMore ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={1.8} />}
            </div>
            <span className={showMore ? 'text-brand-400' : ''}>{showMore ? 'Close' : 'More'}</span>
          </button>

        </div>
      </nav>
    </>
  )
}
