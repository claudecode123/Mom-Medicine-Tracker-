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
    { to: '/stock-days',    icon: CalendarDays, label: 'Days Left',   color: '#34C759',  bg: 'rgba(52,199,89,0.12)'  },
    { to: '/doctor-visits', icon: Stethoscope,  label: 'Doctor',      color: '#32ADE6',  bg: 'rgba(50,173,230,0.12)' },
    { to: '/edit-logs',     icon: ScrollText,   label: 'Edit Logs',   color: '#8E8E93',  bg: 'rgba(142,142,147,0.12)'},
    ...(isAdmin ? [
      { to: '/retroactive', icon: ClockArrowUp, label: 'Past Dose',   color: '#FF9F0A',  bg: 'rgba(255,159,10,0.12)' },
      { to: '/admin',       icon: ShieldCheck,  label: 'Admin',       color: '#D4A843',  bg: 'rgba(212,168,67,0.12)' },
    ] : []),
    { to: '/settings',      icon: Settings,     label: 'Settings',    color: '#8E8E93',  bg: 'rgba(142,142,147,0.12)'},
  ]

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-[66px] left-0 right-0 rounded-t-3xl p-5 pb-6 animate-slide-up"
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#C7C7CC' }} />
            <p className="text-xs font-bold text-warm-500 uppercase tracking-widest mb-3 text-center">More</p>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map(({ to, icon: Icon, label, color, bg }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => cn(
                    'flex flex-col items-center gap-2 p-3 rounded-2xl text-xs font-semibold transition-all duration-150',
                    isActive ? 'ring-2' : ''
                  )}
                  style={({ isActive }) => ({
                    background: isActive ? bg : 'rgba(0,0,0,0.03)',
                    ringColor: isActive ? color : 'transparent',
                    border: isActive ? `1.5px solid ${color}40` : '1.5px solid transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: isActive ? bg : 'rgba(0,0,0,0.05)' }}
                      >
                        <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} style={{ color: isActive ? color : '#8E8E93' }} />
                      </div>
                      <span style={{ color: isActive ? color : '#3A3A3C' }} className="text-center leading-tight text-[11px]">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* iOS translucent tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch max-w-lg mx-auto">

          {/* Home */}
          <NavLink to="/" end className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[66px] relative',
            isActive ? 'text-brand-600' : 'text-warm-400'
          )}>
            {({ isActive }) => (
              <>
                <div
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200', isActive && 'scale-110')}
                  style={isActive ? { background: 'rgba(255,159,10,0.12)' } : {}}
                >
                  <Home size={20} strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#FF9F0A' : '#AEAEB2' }} />
                </div>
                <span style={{ color: isActive ? '#FF9F0A' : '#AEAEB2' }}>Home</span>
              </>
            )}
          </NavLink>

          {/* Meds */}
          <NavLink to="/medicines" className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[66px] relative',
          )}>
            {({ isActive }) => (
              <>
                <div
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200', isActive && 'scale-110')}
                  style={isActive ? { background: 'rgba(10,132,255,0.12)' } : {}}
                >
                  <Pill size={20} strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#0A84FF' : '#AEAEB2' }} />
                </div>
                <span style={{ color: isActive ? '#0A84FF' : '#AEAEB2' }}>Meds</span>
              </>
            )}
          </NavLink>

          {/* Centre Log Dose — gold floating button */}
          <NavLink
            to="/log-dose"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all duration-200 min-h-[66px]"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn('rounded-2xl flex items-center justify-center log-glow transition-all duration-200', isActive && 'scale-105')}
                  style={{
                    width: 52,
                    height: 52,
                    background: 'linear-gradient(135deg, #E8C158 0%, #D4A843 60%, #B45309 100%)',
                    boxShadow: isActive ? '0 4px 20px rgba(212,168,67,0.6)' : '0 4px 16px rgba(212,168,67,0.4)',
                  }}
                >
                  <PlusCircle size={24} className="text-white" strokeWidth={2.2} />
                </div>
                <span style={{ color: '#D4A843', fontWeight: 700 }}>Log</span>
              </>
            )}
          </NavLink>

          {/* History */}
          <NavLink to="/history" className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[66px] relative',
          )}>
            {({ isActive }) => (
              <>
                <div
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200', isActive && 'scale-110')}
                  style={isActive ? { background: 'rgba(175,82,222,0.12)' } : {}}
                >
                  <History size={20} strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#AF52DE' : '#AEAEB2' }} />
                </div>
                <span style={{ color: isActive ? '#AF52DE' : '#AEAEB2' }}>History</span>
              </>
            )}
          </NavLink>

          {/* More */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 min-h-[66px] relative"
          >
            <div
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200', showMore && 'scale-110')}
              style={showMore ? { background: 'rgba(142,142,147,0.12)' } : {}}
            >
              {showMore
                ? <X size={20} strokeWidth={2.5} style={{ color: '#8E8E93' }} />
                : <Menu size={20} strokeWidth={1.8} style={{ color: '#AEAEB2' }} />
              }
            </div>
            <span style={{ color: showMore ? '#8E8E93' : '#AEAEB2' }}>{showMore ? 'Close' : 'More'}</span>
          </button>

        </div>
      </nav>
    </>
  )
}
