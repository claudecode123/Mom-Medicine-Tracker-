import { useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
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

export function HistoryPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data: doses, isLoading } = useDosesForDate(date)

  const dateObj = parseISO(date)
  const isToday = date === format(new Date(), 'yyyy-MM-dd')

  const given = doses?.filter(d => d.status === 'given') ?? []
  const notGiven = doses?.filter(d => d.status !== 'given') ?? []

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-warm-800">History</h1>

      {/* Date navigator */}
      <div className="card flex items-center justify-between py-3">
        <button onClick={() => setDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'))}
          className="p-2 rounded-xl hover:bg-warm-100 text-warm-500">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-warm-800">{format(dateObj, 'EEEE')}</p>
          <p className="text-warm-500 text-sm">{format(dateObj, 'd MMMM yyyy')}</p>
          {isToday && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Today</span>}
        </div>
        <button onClick={() => setDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'))}
          disabled={isToday}
          className="p-2 rounded-xl hover:bg-warm-100 text-warm-500 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Date picker */}
      <div>
        <label className="label text-xs">Jump to date</label>
        <input type="date" className="input-field text-sm py-2"
          value={date} max={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => e.target.value && setDate(e.target.value)} />
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-brand-600">{given.length}</p>
              <p className="text-xs text-warm-500">Doses given</p>
            </div>
            <div className="card text-center">
              <p className={cn('text-2xl font-bold', notGiven.length > 0 ? 'text-amber-500' : 'text-warm-300')}>{notGiven.length}</p>
              <p className="text-xs text-warm-500">Not recorded</p>
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
              <h2 className="font-semibold text-warm-700 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-brand-500" /> Doses Given ({given.length})
              </h2>
              <div className="space-y-2">
                {given.map(dose => (
                  <div key={dose.id} className="card border border-brand-100 bg-brand-50 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-warm-800">{(dose as any).medicines?.name}</p>
                          <p className="text-xs text-warm-500 capitalize">{dose.scheduled_period.replace('_', ' ')}</p>
                        </div>
                        {dose.photo_storage_path ? (
                          <PhotoThumb path={dose.photo_storage_path} />
                        ) : (
                          <div className="text-xs text-amber-500 flex items-center gap-1 flex-shrink-0">
                            <Image size={12} /> No photo
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-warm-500">
                        {dose.administered_at && <span>at {format(new Date(dose.administered_at), 'h:mm a')}</span>}
                        {dose.quantity_administered && <span>{dose.quantity_administered} {(dose as any).medicines?.stock_unit}</span>}
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
              <h2 className="font-semibold text-warm-700 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-warm-400" /> Not Recorded ({notGiven.length})
              </h2>
              <div className="space-y-2">
                {notGiven.map(dose => (
                  <div key={dose.id} className="card border border-warm-200 flex items-center gap-3">
                    <SkipForward size={16} className="text-warm-300 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warm-700 text-sm">{(dose as any).medicines?.name}</p>
                      <p className="text-xs text-warm-400 capitalize">{dose.scheduled_period.replace('_', ' ')} · {dose.status}</p>
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
