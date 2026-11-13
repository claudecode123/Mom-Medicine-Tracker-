import { useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, SkipForward, Image } from 'lucide-react'
import { useDosesForDate, usePhotoUrl } from '@/hooks/useDoses'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

function PhotoThumb({ path }: { path: string }) {
  const { data: url } = usePhotoUrl(path)
  const [showFull, setShowFull] = useState(false)

  if (!url) return <div className="w-10 h-10 rounded-xl bg-warm-100 animate-pulse" />

  return (
    <>
      <button onClick={() => setShowFull(true)}>
        <img src={url} alt="Dose photo" className="w-10 h-10 rounded-xl object-cover border border-warm-200" />
      </button>
      {showFull && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowFull(false)}>
          <img src={url} alt="Full dose photo" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </>
  )
}

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

  const given = doses?.filter(d => d.status === 'given') ?? []
  const notGiven = doses?.filter(d => d.status !== 'given') ?? []

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-black text-warm-900" style={{ fontFamily: 'var(--font-display)' }}>History</h1>
        <span className="text-xs font-bold text-warm-400 uppercase tracking-widest">Dose Log</span>
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
                  active ? 'scale-105' : 'hover:scale-102'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, #E8C158 0%, #D4A843 60%, #C49230 100%)',
                  boxShadow: '0 4px 16px rgba(212,168,67,0.4)',
                } : {
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <span className={cn('text-[10px] font-semibold uppercase tracking-wide', active ? 'text-white/80' : 'text-warm-400')}>
                  {today ? 'Today' : format(dObj, 'EEE')}
                </span>
                <span className={cn('text-lg font-black leading-none', active ? 'text-white' : 'text-warm-900')}>
                  {format(dObj, 'd')}
                </span>
                <span className={cn('text-[9px] font-medium', active ? 'text-white/70' : 'text-warm-400')}>
                  {format(dObj, 'MMM')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Date navigator ── */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'))}
          className="p-2.5 rounded-xl transition-all bg-white border text-warm-500 hover:text-warm-900 hover:shadow-sm"
          style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 text-center bg-white rounded-2xl py-2.5 px-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="font-bold text-warm-900 text-sm leading-tight">
            {format(dateObj, 'EEEE, d MMMM yyyy')}
          </p>
          {isToday && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: 'rgba(212,168,67,0.12)', color: '#B45309', border: '1px solid rgba(212,168,67,0.25)' }}>
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => setDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'))}
          disabled={isToday}
          className="p-2.5 rounded-xl transition-all bg-white border text-warm-500 hover:text-warm-900 hover:shadow-sm disabled:opacity-30"
          style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
              <p className="text-[2.4rem] font-black leading-none" style={{ color: '#34C759' }}>
                {given.length}
              </p>
              <p className="text-[11px] text-warm-500 mt-1 font-semibold tracking-wide">Doses given</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center"
              style={{
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: notGiven.length > 0 ? '1px solid rgba(255,159,10,0.2)' : '1px solid rgba(0,0,0,0.06)',
              }}>
              <p className={cn('text-[2.4rem] font-black leading-none')}
                style={{ color: notGiven.length > 0 ? '#FF9F0A' : '#C7C7CC' }}>
                {notGiven.length}
              </p>
              <p className="text-[11px] text-warm-500 mt-1 font-semibold tracking-wide">Not recorded</p>
            </div>
          </div>

          {given.length === 0 && notGiven.length === 0 && (
            <div className="text-center py-14 text-warm-400">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.04)' }}>
                <Clock size={28} className="opacity-50" />
              </div>
              <p className="font-semibold text-warm-500">No doses recorded for this day</p>
              <p className="text-sm text-warm-400 mt-1">Select a different date to browse</p>
            </div>
          )}

          {given.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(52,199,89,0.12)' }}>
                  <CheckCircle2 size={13} style={{ color: '#34C759' }} />
                </div>
                <h2 className="font-bold text-warm-800 text-sm">
                  Doses Given <span className="text-warm-400 font-normal">({given.length})</span>
                </h2>
              </div>
              <div className="space-y-2">
                {given.map(dose => (
                  <div key={dose.id} className="bg-white rounded-2xl p-3.5 flex items-start gap-3"
                    style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(52,199,89,0.12)' }}>
                    {/* Green check chip */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(52,199,89,0.1)' }}>
                      <CheckCircle2 size={18} style={{ color: '#34C759' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-warm-900 text-sm">{(dose as any).medicines?.name}</p>
                          <p className="text-xs text-warm-400 capitalize mt-0.5">{dose.scheduled_period.replace('_', ' ')}</p>
                        </div>
                        {dose.photo_storage_path ? (
                          <PhotoThumb path={dose.photo_storage_path} />
                        ) : (
                          <div className="text-[10px] text-warm-400 flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.04)' }}>
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
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <Clock size={13} className="text-warm-400" />
                </div>
                <h2 className="font-bold text-warm-800 text-sm">
                  Not Recorded <span className="text-warm-400 font-normal">({notGiven.length})</span>
                </h2>
              </div>
              <div className="space-y-2">
                {notGiven.map(dose => (
                  <div key={dose.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3"
                    style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <SkipForward size={15} className="text-warm-400" />
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
