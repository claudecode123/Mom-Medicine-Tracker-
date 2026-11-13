import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, AlertTriangle, Calendar, History } from 'lucide-react'
import { useTodayDoses } from '@/hooks/useDoses'
import { useMedicines } from '@/hooks/useMedicines'
import { useUpcomingFollowUp } from '@/hooks/useDoctorVisits'
import { useAuth } from '@/context/AuthContext'
import { DoseCard } from '@/components/doses/DoseCard'
import { BulkRecordModal } from '@/components/doses/BulkRecordModal'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Pill } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { stockStatusColor, TIME_PERIODS, type TimePeriod } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { MemojiAvatar } from '@/components/common/MemojiAvatar'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { profile } = useAuth()
  const { data: doses, isLoading: dosesLoading } = useTodayDoses()
  const { data: medicines } = useMedicines()
  const { data: nextVisit } = useUpcomingFollowUp()
  const [collapsedPeriods, setCollapsedPeriods] = useState<Set<TimePeriod>>(new Set())
  const [bulkPeriod, setBulkPeriod] = useState<TimePeriod | null>(null)

  const togglePeriod = (p: TimePeriod) =>
    setCollapsedPeriods(prev => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s })

  const totalDoses = doses?.length ?? 0
  const givenDoses = doses?.filter(d => d.status === 'given').length ?? 0
  const pendingDoses = doses?.filter(d => d.status === 'pending' || d.status === 'overdue').length ?? 0
  const displayName = profile?.display_name ?? profile?.caregiver_name ?? 'there'

  const lowStockMeds = medicines?.filter(m => {
    if (!m.active || m.archived_at) return false
    const days = m.current_stock > 0 ? m.current_stock : 0
    return stockStatusColor(days) !== 'ok'
  }) ?? []

  const completionPct = totalDoses > 0 ? Math.round((givenDoses / totalDoses) * 100) : 0

  if (dosesLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* ── Hero header — warm gold gradient ── */}
      <div
        className="-mx-4 -mt-5 overflow-hidden px-5 pt-6 pb-7 relative"
        style={{
          background: 'linear-gradient(145deg, #E8C158 0%, #D4A843 45%, #C49230 100%)',
          borderRadius: '0 0 28px 28px',
        }}
      >
        {/* Decorative radial highlight */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-8 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.04))' }} />

        {/* Greeting row */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-0.5">
              {format(new Date(), 'EEEE, d MMMM')}
            </p>
            <h1 className="text-[1.5rem] font-black text-white leading-tight" style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              {getGreeting()}, {displayName}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              {profile?.patient_name ? `Tracking ${profile.patient_name}'s meds` : "Let's check the medicines"}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg">
              <MemojiAvatar seed={displayName} size={52} rounded="2xl" avatarIndex={profile?.avatar_index ?? null} />
            </div>
          </div>
        </div>

        {/* Stat cards with glassmorphism */}
        <div className="grid grid-cols-3 gap-2.5 relative z-10">
          <div className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
            <p className="text-[1.9rem] font-black leading-none text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {givenDoses}
            </p>
            <p className="text-[10px] text-white/75 mt-1 font-semibold tracking-wide">Given</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
            <p className={`text-[1.9rem] font-black leading-none ${pendingDoses > 0 ? 'text-white' : 'text-white/40'}`}
              style={{ textShadow: pendingDoses > 0 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>
              {pendingDoses}
            </p>
            <p className="text-[10px] text-white/75 mt-1 font-semibold tracking-wide">Pending</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
            <p className="text-[1.9rem] font-black leading-none text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {completionPct}%
            </p>
            <p className="text-[10px] text-white/75 mt-1 font-semibold tracking-wide">Done</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalDoses > 0 && (
          <div className="mt-4 relative z-10">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%`, background: 'rgba(255,255,255,0.9)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {lowStockMeds.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border-l-4"
          style={{ borderLeftColor: '#FF9F0A', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(255,159,10,0.2)', borderLeft: '4px solid #FF9F0A' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#FF9F0A' }} />
            <p className="font-semibold text-sm text-warm-900">Low Stock Alert</p>
          </div>
          <div className="space-y-1">
            {lowStockMeds.slice(0, 3).map(m => {
              const status = stockStatusColor(m.current_stock)
              return (
                <p key={m.id} className={`text-sm ${status === 'out' ? 'text-red-600' : status === 'urgent' ? 'text-orange-700' : 'text-amber-600'}`}>
                  {status === 'out' ? '⛔' : status === 'urgent' ? '🔴' : '🟡'} {m.name} — {m.current_stock <= 0 ? 'out of stock' : `${m.current_stock} ${m.stock_unit} left`}
                </p>
              )
            })}
          </div>
          {lowStockMeds.length > 3 && (
            <Link to="/medicines" className="text-xs underline mt-1 block" style={{ color: '#B45309' }}>
              +{lowStockMeds.length - 3} more…
            </Link>
          )}
        </div>
      )}

      {/* Follow-up reminder */}
      {nextVisit?.follow_up_date && (
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(10,132,255,0.15)', borderLeft: '4px solid #0A84FF' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(10,132,255,0.1)' }}>
            <Calendar size={20} style={{ color: '#0A84FF' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-900">Upcoming Follow-up</p>
            <p className="text-sm text-warm-500">
              {nextVisit.doctor_name} · {format(new Date(nextVisit.follow_up_date), 'd MMM yyyy')}
            </p>
          </div>
        </div>
      )}

      {/* Dose schedule by period */}
      {totalDoses === 0 ? (
        <EmptyState
          icon={Pill}
          title="No doses scheduled today"
          description="Add medicines and set up their schedules to see today's doses here."
          action={<Link to="/medicines" className="btn-primary">Add Medicine</Link>}
        />
      ) : (
        <div className="space-y-4">
          {TIME_PERIODS.map(({ value, label, time, icon }) => {
            const periodDosesRaw = doses?.filter(d => d.scheduled_period === value) ?? []
            if (periodDosesRaw.length === 0) return null

            const periodDoses = [...periodDosesRaw].sort((a, b) => {
              const medA = medicines?.find(m => m.id === a.medicine_id)
              const medB = medicines?.find(m => m.id === b.medicine_id)
              const schedA = (medA as any)?.medicine_schedules?.find(
                (s: any) => s.time_period === value && s.active !== false
              )
              const schedB = (medB as any)?.medicine_schedules?.find(
                (s: any) => s.time_period === value && s.active !== false
              )
              return (schedA?.sort_order ?? 99) - (schedB?.sort_order ?? 99)
            })

            const isCollapsed = collapsedPeriods.has(value)
            const givenCount = periodDoses.filter(d => d.status === 'given').length
            const pendingCount = periodDoses.filter(d => d.status === 'pending' || d.status === 'overdue').length
            const allDone = pendingCount === 0 && givenCount === periodDoses.length

            return (
              <div key={value}>
                <div className="flex items-center gap-2 py-1.5">
                  <button
                    onClick={() => togglePeriod(value)}
                    className="flex-1 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: allDone ? 'rgba(52,199,89,0.12)' : 'rgba(212,168,67,0.1)' }}
                      >
                        {icon}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-warm-900 text-sm">{label}</span>
                        <span className="text-warm-400 text-xs ml-2">{time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: allDone ? 'rgba(52,199,89,0.1)' : 'rgba(0,0,0,0.05)',
                          color: allDone ? '#1A7F3C' : '#8E8E93',
                        }}
                      >
                        {givenCount}/{periodDoses.length}
                      </span>
                      {isCollapsed ? <ChevronDown size={16} className="text-warm-300" /> : <ChevronUp size={16} className="text-warm-300" />}
                    </div>
                  </button>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => setBulkPeriod(value)}
                      className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl ml-1 transition-all"
                      style={{ background: 'rgba(212,168,67,0.12)', color: '#B45309', border: '1px solid rgba(212,168,67,0.25)' }}
                    >
                      Log All
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {periodDoses.map(dose => {
                      const med = medicines?.find(m => m.id === dose.medicine_id)
                      const scheduleForDose = (med as any)?.medicine_schedules?.find(
                        (s: any) => s.time_period === dose.scheduled_period && s.active !== false
                      )
                      return (
                        <DoseCard
                          key={dose.id}
                          dose={dose as any}
                          schedule={scheduleForDose ? {
                            id: scheduleForDose.id,
                            time_period: scheduleForDose.time_period,
                            quantity_per_dose: scheduleForDose.quantity_per_dose,
                          } : null}
                          requirePhoto={profile?.require_photo_for_dose}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* History shortcut */}
      {totalDoses > 0 && (
        <Link
          to="/history"
          className="flex items-center justify-center gap-2 text-sm py-2 font-medium"
          style={{ color: '#D4A843' }}
        >
          <History size={14} />
          View dose history
        </Link>
      )}

      {bulkPeriod && (() => {
        const periodDoses = doses?.filter(d => d.scheduled_period === bulkPeriod) ?? []
        const periodLabel = TIME_PERIODS.find(p => p.value === bulkPeriod)?.label ?? bulkPeriod
        const items = periodDoses.map(dose => {
          const med = medicines?.find(m => m.id === dose.medicine_id)
          const scheduleForDose = (med as any)?.medicine_schedules?.find(
            (s: any) => s.time_period === dose.scheduled_period && s.active !== false
          )
          return {
            dose: dose as any,
            schedule: scheduleForDose ? {
              id: scheduleForDose.id,
              time_period: scheduleForDose.time_period,
              quantity_per_dose: scheduleForDose.quantity_per_dose,
            } : null,
          }
        })
        return (
          <BulkRecordModal
            periodLabel={periodLabel}
            items={items}
            onClose={() => setBulkPeriod(null)}
          />
        )
      })()}
    </div>
  )
}
