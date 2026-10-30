import { useState, useRef, useEffect } from 'react'
import { X, Camera, CheckCircle, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'
import { useRecordDose } from '@/hooks/useDoses'
import { useAlternativeBrands } from '@/hooks/useAlternativeBrands'
import { useAuth } from '@/context/AuthContext'
import type { TimePeriod } from '@/types/database'

interface Props {
  medicine: {
    id: string
    name: string
    strength: string | null
    stock_unit: string
    instructions: string | null
    current_stock: number
    preferred_brand?: string | null
    needs_confirmation?: boolean
    confirmation_notes?: string | null
    category?: string | null
    is_critical?: boolean
  }
  schedule: {
    id: string
    time_period: TimePeriod
    quantity_per_dose: number
  }
  scheduledFor: string
  onClose: () => void
  requirePhoto?: boolean
}

export function RecordDoseModal({ medicine, schedule, scheduledFor, onClose, requirePhoto = false }: Props) {
  const { profile } = useAuth()
  const recordDose = useRecordDose()
  const { data: altBrands = [] } = useAlternativeBrands(medicine.id)
  const fileRef = useRef<HTMLInputElement>(null)

  const [quantity, setQuantity] = useState(schedule.quantity_per_dose.toString())
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [noPhoto, setNoPhoto] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Brand selection
  const hasBrands = altBrands.length > 0
  const [selectedBrand, setSelectedBrand] = useState<string>('')

  // Initialise to preferred brand when brands load
  useEffect(() => {
    if (hasBrands) {
      setSelectedBrand(medicine.preferred_brand ?? altBrands[0]?.brand_name ?? '')
    }
  }, [altBrands.length, medicine.preferred_brand])

  const qty = parseFloat(quantity) || 0
  const enoughStock = qty <= medicine.current_stock

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setNoPhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (requirePhoto && !photo && !noPhoto) {
      setError('A photo is required. Please take a photo or check "Record without photo".')
      return
    }
    if (qty <= 0) { setError('Please enter a valid quantity.'); return }
    if (!enoughStock) { setError(`Not enough stock. Current stock: ${medicine.current_stock} ${medicine.stock_unit}.`); return }
    if (hasBrands && !selectedBrand) {
      setError('Please select the brand you are giving.')
      return
    }

    try {
      await recordDose.mutateAsync({
        medicineId: medicine.id,
        scheduleId: schedule.id,
        scheduledPeriod: schedule.time_period,
        scheduledFor,
        quantityAdministered: qty,
        photo,
        notes: notes.trim() || null,
        brandUsed: hasBrands ? selectedBrand : null,
      })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-600" />
          </div>
          <h3 className="text-xl font-bold text-warm-800">Dose Recorded!</h3>
          <p className="text-warm-500 mt-1">{medicine.name} — {qty} {medicine.stock_unit}</p>
          {selectedBrand && <p className="text-warm-400 text-xs mt-1">Brand: {selectedBrand}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-warm-100">
          <div>
            <h2 className="font-bold text-warm-800 text-lg">Record Dose</h2>
            {medicine.is_critical && (
              <span className="text-xs text-red-600 font-medium">❤️ Critical Medicine</span>
            )}
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Medicine info */}
          <div className="bg-warm-50 rounded-xl p-4 space-y-1">
            <p className="font-semibold text-warm-800">{medicine.name}</p>
            {medicine.strength && <p className="text-sm text-warm-500">{medicine.strength}</p>}
            {medicine.category && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                {medicine.category}
              </span>
            )}
            {medicine.instructions && (
              <p className="text-sm text-warm-600 italic">"{medicine.instructions}"</p>
            )}
          </div>

          {/* Confirmation warning */}
          {medicine.needs_confirmation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{medicine.confirmation_notes}</p>
            </div>
          )}

          {/* Brand selector */}
          {hasBrands && (
            <div>
              <label className="label">Which brand are you giving?</label>
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={e => setSelectedBrand(e.target.value)}
                  className="input-field appearance-none pr-10"
                >
                  <option value="">— Select brand —</option>
                  {altBrands.map(b => (
                    <option key={b.id} value={b.brand_name}>
                      {b.brand_name}{b.notes ? ` (${b.notes})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="label">Quantity given</label>
            <div className="flex items-center gap-2">
              <input
                type="number" step="0.5" min="0.5"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="input-field flex-1"
              />
              <span className="text-warm-500 text-sm font-medium whitespace-nowrap">{medicine.stock_unit}</span>
            </div>
            {!enoughStock && qty > 0 && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Only {medicine.current_stock} {medicine.stock_unit} in stock
              </p>
            )}
          </div>

          {/* Photo */}
          <div>
            <label className="label">Photo proof {requirePhoto ? '(required)' : '(optional)'}</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Dose photo" className="w-full h-40 object-cover rounded-xl" />
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-warm-600 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-warm-200 rounded-xl py-5 text-warm-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  <Camera size={20} />
                  <span className="font-medium text-sm">Take Photo / Choose Image</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  onChange={handleFileChange} className="hidden" />
                {!requirePhoto && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-warm-500">
                    <input type="checkbox" checked={noPhoto} onChange={e => setNoPhoto(e.target.checked)} className="rounded" />
                    Record without photo
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Any observations or notes…"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={recordDose.isPending} className="btn-primary flex-1">
              {recordDose.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Dose ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
