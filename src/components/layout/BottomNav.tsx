import { NavLink } from 'react-router-dom'
import { Home, Pill, Settings, PlusCircle, History, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function BottomNav() {
  const { isAdmin } = useAuth()

  const leftItems = [
    { to: '/',          icon: Home,    label: 'Home' },
    { to: '/medicines', icon: Pill,    label: 'Meds' },
  ]

  const rightItems = [
    { to: '/history',    icon: History,     label: 'History' },
    { to: '/settings',   icon: Settings,    label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-100 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {leftItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
                isActive ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center Log Dose button */}
        <NavLink
          to="/log-dose"
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-colors min-h-[56px]',
              isActive ? 'text-brand-600' : 'text-brand-500 hover:text-brand-700'
            )
          }
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

        {rightItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
                isActive ? 'text-brand-600' : 'text-warm-400 hover:text-warm-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
