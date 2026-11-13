import { useState, useRef } from 'react'
import { Camera, X, CheckCircle, Loader2, AlertTriangle, ChevronDown, ImagePlus, Trash2 } from 'lucide-react'
import { OrganIconChip } from '@/components/common/OrganIconChip'
import { useMedicines } from '@/hooks/useMedicines'
import { useRecordDose } from '@/hooks/useDoses'
import { useAlternativeBrands } from '@/hooks/useAlternativeBrands'
import { usePeriodPhoto, usePeriodPhotoUrl, useUploadPeriodPhoto, useDeletePeriodPhoto } from '@/hooks/usePeriodPhotos'
import { TIME_PERIODS, type TimePeriod } from '@/lib/utils'
import { format } from 'date-fns'

function currentPeriod(): TimePeriod {
  const h = new Date().getHours()
  if (h < 7) return 'early_morning'
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const periodScheduledTime: Record<TimePeriod, string> = {
  early_morning: '06:00:00',
  morning: '08:00:00',
  afternoon: '13:00:00',
  evening: '18:00:00',
}

interface LogTarget {
  medicineId: string
  medicineName: string
  strength: string | null
  stockUnit: string
  category: string | null
  isCritical: boolean
  needsConfirmation: boolean
  confirmationNotes: string | null
  preferredBrand: string | null
  currentStock: number
  period: TimePeriod
  scheduleId: string
  defaultQty: number
}

function QuickLogModal({
  target,
  onClose,
  onSuccess,
}: {
  target: LogTarget
  onClose: () => void
  onSuccess: () => void
}) {
  const { data: altBrands = [] } = useAlternativeBrands(target.medicineId)
  const recordDose = useRecordDose()

  const [quantity, setQuantity] = useState(String(target.defaultQty))
  const [brandUsed, setBrandUsed] = useState(target.preferredBrand ?? '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const qty = parseFloat(quantity) || 0
  const enoughStock = qty <= target.currentStock

  async function handleRecord() {
    setError(null)
    if (qty <= 0) { setError('Enter a valid quantity.'); return }
    if (!enoughStock) { setError(`Only ${target.currentStock} ${target.stockUnit} in stock.`); return }

    const scheduledFor = `${format(new Date(), 'yyyy-MM-dd')}T${periodScheduledTime[target.period]}`
    try {
      await recordDose.mutateAsync({
        medicineId: target.medicineId,
        scheduleId: target.scheduleId,
        scheduledPeriod: target.period,
        scheduledFor,
        quantityAdministered: qty,
        photo: null,
        notes: notes.trim() || null,
        brandUsed: brandUsed || null,
      })
      setDone(true)
      setTimeout(onSuccess, 900)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record dose.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-warm-800">{target.medicineName}</h2>
            <p className="text-sm text-warm-400">
              {target.strength && `${target.strength} · `}
              {target.category}
            </p>
          </div>
          <button onClick={onClose} disabled={recordDose.isPending}
            className="w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center text-warm-500 hover:bg-warm-200">
            <X size={18} />
          </button>
        </div>

        <div className="border-t border-warm-100" />

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Confirmation warning */}
          {target.needsConfirmation && target.confirmationNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{target.confirmationNotes}</p>
            </div>
          )}

          {/* Brand picker */}
          {altBrands.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Brand</label>
              <div className="relative">
                <select value={brandUsed} onChange={e => setBrandUsed(e.target.value)}
                  className="input-field appearance-none pr-10 text-sm">
                  <option value="">— Select brand —</option>
                  {altBrands.map(b => (
                    <option key={b.id} value={b.brand_name}>
                      {b.brand_name}{b.notes ? ` ⚠ ${b.notes}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Quantity</label>
            <div className="flex items-center gap-2">
              <input type="number" step="0.5" min="0.5" value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="input-field flex-1 text-sm" />
              <span className="text-warm-500 text-sm font-medium whitespace-nowrap">{target.stockUnit}</span>
            </div>
            {!enoughStock && qty > 0 && (
              <p className="text-amber-600 text-xs flex items-center gap-1">
                <AlertTriangle size={12} /> Only {target.currentStock} {target.stockUnit} left
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="input-field resize-none text-sm" rows={2}
              placeholder="Observations, side effects…" />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-warm-100">
          {done ? (
            <div className="btn-primary w-full justify-center gap-2 bg-green-500 pointer-events-none">
              <CheckCircle size={18} /> Logged!
            </div>
          ) : (
            <button onClick={handleRecord} disabled={recordDose.isPending}
              className="btn-primary w-full justify-center gap-2">
              {recordDose.isPending
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : 'Record Dose ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PeriodPhotoCard({ date, period, periodLabel }: { date: string; period: TimePeriod; periodLabel: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: existing } = usePeriodPhoto(date, period)
  const { data: photoUrl } = usePeriodPhotoUrl(existing?.photo_storage_path ?? null)
  const upload = useUploadPeriodPhoto()
  const remove = useDeletePeriodPhoto()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''
    await upload.mutateAsync({
      date,
      period,
      photo: file,
      existingId: existing?.id,
    })
  }

  async function handleRemove() {
    if (!existing) return
    await remove.mutateAsync({
      id: existing.id,
      date,
      period,
      path: existing.photo_storage_path,
    })
  }

  return (
    <div className="card border-2 border-dashed border-warm-200">
      <div className="flex items-center gap-3 mb-3">
        <Camera size={15} className="text-warm-400" />
        <span className="text-sm font-semibold text-warm-700">{periodLabel} Photo</span>
        <span className="text-xs text-warm-400 font-normal">(one photo for all medicines)</span>
      </div>

      {photoUrl ? (
        <div className="relative">
          <img src={photoUrl} alt="Period photo" className="w-full h-40 object-cover rounded-xl" />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-white rounded-full p-2 shadow text-warm-600 hover:text-brand-500"
              title="Replace photo"
            >
              <Camera size={14} />
            </button>
            <button
              onClick={handleRemove}
              disabled={remove.isPending}
              className="bg-white rounded-full p-2 shadow text-warm-600 hover:text-red-500"
              title="Remove photo"
            >
              {remove.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-xl text-warm-400 hover:text-brand-500 hover:bg-brand-50 transition-colors text-sm"
        >
          {upload.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Uploading…</>
            : <><ImagePlus size={18} /> Add {periodLabel} photo</>
          }
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} className="hidden" />

      {upload.isError && (
        <p className="text-red-600 text-xs mt-2">{(upload.error as any)?.message}</p>
      )}
    </div>
  )
}

export function LogDosePage() {
  const { data: medicines = [] } = useMedicines()
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(currentPeriod())
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null)
  const [recentlyLogged, setRecentlyLogged] = useState<Set<string>>(new Set())

  const today = format(new Date(), 'yyyy-MM-dd')

  const periodMeds = TIME_PERIODS.map(tp => {
    const meds = medicines
      .map(m => {
        const sched = m.medicine_schedules?.find(
          (s: any) => s.time_period === tp.value && s.active !== false
        )
        if (!sched) return null
        return { med: m, sched, sortOrder: sched.sort_order ?? 99 }
      })
      .filter(Boolean)
      .sort((a, b) => a!.sortOrder - b!.sortOrder)
    return { ...tp, meds }
  })

  const activePeriodData = periodMeds.find(p => p.value === activePeriod)

  function openLog(m: any, sched: any, period: TimePeriod) {
    setLogTarget({
      medicineId: m.id,
      medicineName: m.name,
      strength: m.strength,
      stockUnit: m.stock_unit,
      category: m.category,
      isCritical: m.is_critical,
      needsConfirmation: m.needs_confirmation,
      confirmationNotes: m.confirmation_notes,
      preferredBrand: m.preferred_brand,
      currentStock: m.current_stock,
      period,
      scheduleId: sched.id,
      defaultQty: sched.quantity_per_dose,
    })
  }

  function handleSuccess(medicineId: string) {
    setRecentlyLogged(prev => new Set(prev).add(medicineId))
    setLogTarget(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-warm-800">Log a Dose</h1>
        <p className="text-warm-400 text-sm mt-0.5">Select a medicine to record it as given</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {periodMeds.map(p => (
          <button
            key={p.value}
            onClick={() => setActivePeriod(p.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
              activePeriod === p.value
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-warm-100 text-warm-500 bg-white hover:border-warm-300'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {p.meds.length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                activePeriod === p.value ? 'bg-brand-200 text-brand-700' : 'bg-warm-100 text-warm-500'
              }`}>{p.meds.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Period photo card */}
      {activePeriodData && activePeriodData.meds.length > 0 && (
        <PeriodPhotoCard
          date={today}
          period={activePeriod}
          periodLabel={activePeriodData.label}
        />
      )}

      {/* Medicine list for active period */}
      {activePeriodData && (
        <div className="space-y-2">
          {activePeriodData.meds.length === 0 ? (
            <p className="text-warm-400 text-sm text-center py-8">No medicines scheduled for this period.</p>
          ) : (
            activePeriodData.meds.map((item) => {
              if (!item) return null
              const { med, sched } = item
              const justLogged = recentlyLogged.has(med.id)
              const outOfStock = med.current_stock <= 0
              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => !justLogged && openLog(med, sched, activePeriod)}
                  disabled={justLogged}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                    justLogged
                      ? 'border-green-200 bg-green-50'
                      : outOfStock
                      ? 'border-warm-100 bg-white opacity-75'
                      : 'border-warm-100 bg-white hover:border-brand-300 hover:bg-brand-50 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <OrganIconChip name={med.name} size={34} radius={9} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${justLogged ? 'text-green-700' : 'text-warm-800'}`}>
                          {med.name}
                        </span>
                        {med.strength && (
                          <span className="text-xs text-warm-400">{med.strength}</span>
                        )}
                        {med.is_critical && !justLogged && (
                          <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full font-medium">Critical</span>
                        )}
                        {outOfStock && !justLogged && (
                          <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded-full font-medium">Out of stock</span>
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-0.5">{sched.quantity_per_dose} {med.stock_unit}</p>
                    </div>
                    {justLogged ? (
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${outOfStock ? 'bg-warm-100' : 'bg-brand-50'}`}>
                        <span className={`text-lg ${outOfStock ? 'text-warm-300' : 'text-brand-400'}`}>+</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {logTarget && (
        <QuickLogModal
          target={logTarget}
          onClose={() => setLogTarget(null)}
          onSuccess={() => handleSuccess(logTarget.medicineId)}
        />
      )}
    </div>
  )
}
