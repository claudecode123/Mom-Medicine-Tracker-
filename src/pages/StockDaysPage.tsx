import { useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { AlertTriangle, CalendarCheck, PackageSearch, TrendingDown } from 'lucide-react'
import { useMedicines } from '@/hooks/useMedicines'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Link } from 'react-router-dom'

interface MedDaysData {
  id: string
  name: string
  strength: string | null
  category: string | null
  stock: number
  stockUnit: string
  dailyDose: number
  daysLeft: number | null   // null = no daily dose scheduled
  runoutDate: Date | null
}

function urgencyLevel(daysLeft: number | null): 'out' | 'critical' | 'low' | 'ok' {
  if (daysLeft === null) return 'ok'
  if (daysLeft <= 0) return 'out'
  if (daysLeft <= 5) return 'critical'
  if (daysLeft < 14) return 'low'
  return 'ok'
}

const urgencyStyles = {
  out:      { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',    card: 'border-red-200 bg-red-50',     icon: '⛔' },
  critical: { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', card: 'border-orange-200 bg-orange-50', icon: '🔴' },
  low:      { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700 border-amber-200', card: 'border-amber-100 bg-amber-50', icon: '🟡' },
  ok:       { bar: 'bg-brand-400',  badge: 'bg-brand-50 text-brand-700 border-brand-200', card: 'border-warm-100 bg-white',    icon: '✅' },
}

function DaysBar({ daysLeft, max = 60 }: { daysLeft: number; max?: number }) {
  const pct = Math.min(100, (daysLeft / max) * 100)
  const level = urgencyLevel(daysLeft)
  return (
    <div className="h-1.5 w-full bg-warm-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${urgencyStyles[level].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function StockDaysPage() {
  const { data: medicines = [], isLoading } = useMedicines()

  const rows = useMemo<MedDaysData[]>(() => {
    return medicines
      .filter(m => m.active && !m.archived_at)
      .map(m => {
        const schedules: Array<{ quantity_per_dose: number }> =
          (m as any).medicine_schedules?.filter((s: any) => s.active !== false) ?? []
        const dailyDose = schedules.reduce((sum, s) => sum + (s.quantity_per_dose ?? 0), 0)
        const stock = m.current_stock ?? 0
        const daysLeft = dailyDose > 0 ? Math.floor(stock / dailyDose) : null
        const runoutDate = daysLeft !== null ? addDays(new Date(), daysLeft) : null
        return {
          id: m.id,
          name: m.name,
          strength: m.strength,
          category: m.category,
          stock,
          stockUnit: m.stock_unit,
          dailyDose,
          daysLeft,
          runoutDate,
        }
      })
      .sort((a, b) => {
        // Sort: out first, then by days ascending, then null (no schedule) last
        if (a.daysLeft === null && b.daysLeft === null) return a.name.localeCompare(b.name)
        if (a.daysLeft === null) return 1
        if (b.daysLeft === null) return -1
        return a.daysLeft - b.daysLeft
      })
  }, [medicines])

  const outCount      = rows.filter(r => r.daysLeft !== null && r.daysLeft <= 0).length
  const criticalCount = rows.filter(r => r.daysLeft !== null && r.daysLeft > 0 && r.daysLeft <= 5).length
  const lowCount      = rows.filter(r => r.daysLeft !== null && r.daysLeft >= 6 && r.daysLeft < 14).length

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-warm-800">Days Remaining</h1>
        <p className="text-warm-400 text-sm mt-0.5">
          Based on current stock ÷ daily dose schedule
        </p>
      </div>

      {/* Summary chips */}
      {(outCount + criticalCount + lowCount) > 0 && (
        <div className="flex flex-wrap gap-2">
          {outCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full px-3 py-1.5 border border-red-200">
              <AlertTriangle size={12} /> {outCount} out of stock
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full px-3 py-1.5 border border-orange-200">
              <TrendingDown size={12} /> {criticalCount} critical (&le;5 days)
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full px-3 py-1.5 border border-amber-200">
              <CalendarCheck size={12} /> {lowCount} low (&lt;14 days)
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-warm-50 rounded-2xl px-4 py-3 text-xs text-warm-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>⛔ Out of stock</span>
        <span>🔴 ≤5 days</span>
        <span>🟡 6–13 days</span>
        <span>✅ ≥14 days</span>
      </div>

      {/* Cards */}
      {rows.length === 0 ? (
        <div className="text-center py-12">
          <PackageSearch size={40} className="text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500 font-medium">No medicines found</p>
          <Link to="/medicines" className="text-brand-600 text-sm underline mt-1 block">
            Add medicines first
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const level = urgencyLevel(row.daysLeft)
            const styles = urgencyStyles[level]
            return (
              <div
                key={row.id}
                className={`rounded-2xl border-2 p-4 ${styles.card}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-warm-800 text-sm">{row.name}</span>
                      {row.strength && (
                        <span className="text-xs text-warm-500">{row.strength}</span>
                      )}
                    </div>
                    {row.category && (
                      <p className="text-xs text-warm-400 mt-0.5">{row.category}</p>
                    )}
                  </div>

                  {/* Days badge */}
                  {row.daysLeft !== null ? (
                    <div className={`flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-1.5 border ${styles.badge}`}>
                      <span className="text-xl font-bold leading-none">{row.daysLeft}</span>
                      <span className="text-[10px] font-medium mt-0.5">days</span>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-1.5 border border-warm-200 bg-warm-100 text-warm-400">
                      <span className="text-[10px] font-medium">no</span>
                      <span className="text-[10px] font-medium">sched.</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {row.daysLeft !== null && row.daysLeft > 0 && (
                  <DaysBar daysLeft={row.daysLeft} />
                )}

                {/* Detail row */}
                <div className="flex items-center justify-between mt-2 text-xs text-warm-500">
                  <span>
                    {styles.icon} {row.stock} {row.stockUnit} ÷ {row.dailyDose}/day
                  </span>
                  {row.runoutDate && row.daysLeft !== null && row.daysLeft > 0 && (
                    <span className="text-right">
                      Runs out {format(row.runoutDate, 'd MMM')}
                    </span>
                  )}
                  {row.daysLeft === 0 && (
                    <span className="text-red-600 font-semibold">Refill now!</span>
                  )}
                  {row.daysLeft !== null && row.daysLeft < 0 && (
                    <span className="text-red-600 font-semibold">Out of stock</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add stock link */}
      <p className="text-center text-xs text-warm-400 pt-2">
        To update stock — go to{' '}
        <Link to="/medicines" className="text-brand-600 underline">Medicines</Link>
        {' '}and tap the + icon on any medicine.
      </p>
    </div>
  )
}
