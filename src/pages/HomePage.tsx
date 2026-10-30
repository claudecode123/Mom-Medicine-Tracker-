import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, AlertTriangle, Calendar } from 'lucide-react'
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

  const lowStockMeds = medicines?.filter(m => {
    if (!m.active || m.archived_at) return false
    const days = m.current_stock > 0 ? m.current_stock : 0
    return stockStatusColor(days) !== 'ok'
  }) ?? []

  if (dosesLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Hero header — 2.AG dark teal with body silhouette */}
      <div className="-mx-4 -mt-5 rounded-b-3xl overflow-hidden bg-brand-800 px-5 pt-6 pb-8 relative">
        {/* Body silhouette */}
        <svg
          viewBox="0 0 120 220"
          className="absolute right-3 bottom-0 h-44 opacity-15 pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Head */}
          <circle cx="60" cy="24" r="18" fill="#2ecea0" />
          {/* Neck */}
          <rect x="54" y="40" width="12" height="10" rx="4" fill="#2ecea0" />
          {/* Torso */}
          <path d="M32 50 Q28 70 30 100 H90 Q92 70 88 50 Q74 44 60 44 Q46 44 32 50Z" fill="#2ecea0" />
          {/* Left arm */}
          <path d="M32 56 Q18 70 16 100 Q20 106 26 104 Q34 80 40 58Z" fill="#2ecea0" />
          {/* Right arm */}
          <path d="M88 56 Q102 70 104 100 Q100 106 94 104 Q86 80 80 58Z" fill="#2ecea0" />
          {/* Left leg */}
          <path d="M42 100 Q36 140 34 170 Q38 176 46 174 Q52 144 54 100Z" fill="#2ecea0" />
          {/* Right leg */}
          <path d="M78 100 Q84 140 86 170 Q82 176 74 174 Q68 144 66 100Z" fill="#2ecea0" />
          {/* Left foot */}
          <ellipse cx="40" cy="176" rx="10" ry="6" fill="#2ecea0" />
          {/* Right foot */}
          <ellipse cx="80" cy="176" rx="10" ry="6" fill="#2ecea0" />
        </svg>

        <p className="text-brand-300 text-sm font-medium">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'Inter Tight, Inter, sans-serif' }}>
          {getGreeting()}, {profile?.caregiver_name ?? 'Caregiver'} 👋
        </h1>

        {/* Stats inline in header */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-3xl font-bold text-brand-300">{givenDoses}</p>
            <p className="text-xs text-white/70 mt-0.5">Given today</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className={`text-3xl font-bold ${pendingDoses > 0 ? 'text-amber-300' : 'text-white/30'}`}>{pendingDoses}</p>
            <p className="text-xs text-white/70 mt-0.5">Still pending</p>
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockMeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="font-semibold text-amber-800 text-sm">Low Stock Alert</p>
          </div>
          <div className="space-y-1">
            {lowStockMeds.slice(0, 3).map(m => {
              const status = stockStatusColor(m.current_stock)
              return (
                <p key={m.id} className={`text-sm ${status === 'out' ? 'text-red-700' : status === 'urgent' ? 'text-orange-700' : 'text-amber-700'}`}>
                  {status === 'out' ? '⛔' : status === 'urgent' ? '🔴' : '🟡'} {m.name} — {m.current_stock <= 0 ? 'out of stock' : `${m.current_stock} ${m.stock_unit} left`}
                </p>
              )
            })}
          </div>
          {lowStockMeds.length > 3 && (
            <Link to="/medicines" className="text-amber-700 text-xs underline mt-1 block">
              +{lowStockMeds.length - 3} more…
            </Link>
          )}
        </div>
      )}

      {/* Follow-up reminder */}
      {nextVisit?.follow_up_date && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <Calendar size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Upcoming Follow-up</p>
            <p className="text-sm text-blue-600">
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

            // Sort by schedule sort_order within the period
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

            return (
              <div key={value}>
                <div className="flex items-center gap-2 py-2">
                  <button
                    onClick={() => togglePeriod(value)}
                    className="flex-1 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <div className="text-left">
                        <span className="font-semibold text-warm-700 text-sm">{label}</span>
                        <span className="text-warm-400 text-xs ml-2">{time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-warm-400">{givenCount}/{periodDoses.length} done</span>
                      {isCollapsed ? <ChevronDown size={16} className="text-warm-400" /> : <ChevronUp size={16} className="text-warm-400" />}
                    </div>
                  </button>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => setBulkPeriod(value)}
                      className="flex-shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl px-3 py-1.5 ml-1"
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
                    )})}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
