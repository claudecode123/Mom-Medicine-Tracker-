import { useState } from 'react'
import { format, addDays, subDays, parseISO, startOfDay, isToday as isTodayFn } from 'date-fns'
import { ChevronLeft, ChevronRight, Camera, CheckCircle, Clock, SkipForward, Image } from 'lucide-react'
import { useDosesForDate } from '@/hooks/useDoses'
import { usePhotoUrl } from '@/hooks/useDoses'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

function PhotoThumb({ path }: { path: string }) {
  const { data: url } = usePhotoUrl(path)
  const [showFull, setShowFull] = useState(false)

  if (!url) return <div className="w-10 h-10 rounded-lg bg-warm-100 animate-pulse" />

  return (
    <>
      <button onClick={() => setShowFull(true)}>
        <img src={url} alt="Dose photo" className="w-10 h-10 rounded-lg object-cover border border-warm-200" />
      </button>
      {showFull && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowFull(false)}>
          <img src={url} alt="Full dose photo" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </>
  )
}

/** Returns an array of the last N days as 'yyyy-MM-dd' strings, newest first */
function getRecentDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'))
}

export function HistoryPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data: doses, isLoading } = useDosesForDate(date)

  const dateObj = parseISO(date)
  const isToday = date === format(new Date(), 'yyyy-MM-dd')
  const recentDays = getRecentDays(10)
  const isInChips = recentDays.includes(date)

  const given = doses?.filter(d => d.status === 'given') ?? []
  const notGiven = doses?.filter(d => d.status !== 'given') ?? []

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-black text-warm-800" style={{ fontFamily: 'Inter Tight, Inter, sans-serif' }}>History</h1>
        <span className="text-xs font-semibold text-warm-400 uppercase tracking-widest">Dose Log</span>
      </div>

      {/* ── Date chip strip ── */}
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {recentDays.map(d => {
            const dObj = parseISO(d)
            const active = d === date
            const today = d === format(new Date(), 'yyyy-MM-dd')
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl text-center transition-all duration-200',
                  active
                    ? 'text-white scale-105'
                    : 'text-warm-400 hover:text-warm-700 hover:scale-102'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, #5865f2, #4752c4)',
                  boxShadow: '0 4px 16px rgba(88,101,242,0.4)',
                } : {
                  background: 'linear-gradient(160deg, #36393f, #313338)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span className={cn('text-[10px] font-semibold uppercase tracking-wide', active ? 'text-white/70' : 'text-warm-400')}>
                  {today ? 'Today' : format(dObj, 'EEE')}
                </span>
                <span className={cn('text-lg font-black leading-none', active ? 'text-white' : 'text-warm-700')}>
                  {format(dObj, 'd')}
                </span>
                <span className={cn('text-[9px] font-medium', active ? 'text-white/60' : 'text-warm-300')}>
                  {format(dObj, 'MMM')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Date navigator (for dates outside the chip strip) ── */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'))}
          className="p-2.5 rounded-xl transition-all duration-150 text-warm-400 hover:text-warm-700"
          style={{ background: 'linear-gradient(160deg, #36393f, #313338)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 text-center rounded-2xl py-2.5 px-4"
          style={{ background: 'linear-gradient(160deg, #36393f, #313338)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-bold text-warm-800 text-sm leading-tight">
            {format(dateObj, 'EEEE, d MMMM yyyy')}
          </p>
          {isToday && (
            <span className="inline-block text-[10px] font-bold text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full border border-brand-500/25 mt-0.5">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => setDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'))}
          disabled={isToday}
          className="p-2.5 rounded-xl transition-all duration-150 text-warm-400 hover:text-warm-700 disabled:opacity-30"
          style={{ background: 'linear-gradient(160deg, #36393f, #313338)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(87,242,135,0.12) 0%, rgba(88,101,242,0.08) 100%)', border: '1px solid rgba(87,242,135,0.2)' }}>
              <p className="text-[2.2rem] font-black leading-none" style={{ color: '#57f287', textShadow: '0 0 20px rgba(87,242,135,0.4)' }}>
                {given.length}
              </p>
              <p className="text-[11px] text-warm-500 mt-1 font-semibold tracking-wide">Doses given</p>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={
                notGiven.length > 0
                  ? { background: 'linear-gradient(135deg, rgba(253,162,32,0.12) 0%, rgba(88,101,242,0.08) 100%)', border: '1px solid rgba(253,162,32,0.2)' }
                  : { background: 'linear-gradient(160deg, #36393f, #313338)', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              <p className={cn('text-[2.2rem] font-black leading-none', notGiven.length === 0 && 'text-warm-300')}
                style={notGiven.length > 0 ? { color: '#fda220', textShadow: '0 0 20px rgba(253,162,32,0.4)' } : {}}>
                {notGiven.length}
              </p>
              <p className="text-[11px] text-warm-500 mt-1 font-semibold tracking-wide">Not recorded</p>
            </div>
          </div>

          {given.length === 0 && notGiven.length === 0 && (
            <div className="text-center py-12 text-warm-400">
              <Clock size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No doses recorded for this day</p>
            </div>
          )}

          {given.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(87,242,135,0.15)' }}>
                  <CheckCircle size={12} style={{ color: '#57f287' }} />
                </div>
                <h2 className="font-bold text-warm-700 text-sm">Doses Given <span className="text-warm-400 font-normal">({given.length})</span></h2>
              </div>
              <div className="space-y-2">
                {given.map(dose => (
                  <div key={dose.id} className="rounded-2xl p-3.5 flex items-start gap-3"
                    style={{ background: 'linear-gradient(160deg, rgba(87,242,135,0.06), #313338)', border: '1px solid rgba(87,242,135,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-warm-800 text-sm">{(dose as any).medicines?.name}</p>
                          <p className="text-xs text-warm-400 capitalize mt-0.5">{dose.scheduled_period.replace('_', ' ')}</p>
                        </div>
                        {dose.photo_storage_path ? (
                          <PhotoThumb path={dose.photo_storage_path} />
                        ) : (
                          <div className="text-[10px] text-warm-400 flex items-center gap-1 flex-shrink-0 bg-warm-100/20 px-2 py-1 rounded-lg">
                            <Image size={10} /> No photo
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-warm-400 flex-wrap">
                        {dose.administered_at && <span>at {format(new Date(dose.administered_at), 'h:mm a')}</span>}
                        {dose.quantity_administered && <span>· {dose.quantity_administered} {(dose as any).medicines?.stock_unit}</span>}
                        {dose.notes && <span>· {dose.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notGiven.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(78,80,88,0.4)' }}>
                  <Clock size={12} className="text-warm-400" />
                </div>
                <h2 className="font-bold text-warm-700 text-sm">Not Recorded <span className="text-warm-400 font-normal">({notGiven.length})</span></h2>
              </div>
              <div className="space-y-2">
                {notGiven.map(dose => (
                  <div key={dose.id} className="rounded-2xl p-3.5 flex items-center gap-3"
                    style={{ background: 'linear-gradient(160deg, #36393f, #313338)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(78,80,88,0.4)' }}>
                      <SkipForward size={13} className="text-warm-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-warm-700 text-sm">{(dose as any).medicines?.name}</p>
                      <p className="text-xs text-warm-400 capitalize mt-0.5">{dose.scheduled_period.replace('_', ' ')} · {dose.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
