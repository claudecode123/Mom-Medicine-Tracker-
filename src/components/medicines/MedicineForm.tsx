import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { useCreateMedicine, useUpdateMedicine, useSaveSchedules } from '@/hooks/useMedicines'
import type { Medicine, MedicineSchedule, TimePeriod, DosageForm } from '@/types/database'
import { TIME_PERIODS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DOSAGE_FORMS: { value: DosageForm; label: string }[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'drops', label: 'Drops' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream' },
  { value: 'other', label: 'Other' },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type ScheduleInput = {
  time_period: TimePeriod
  quantity_per_dose: number
  scheduled_time: string
  applicable_days: string[]
}

interface Props {
  medicine?: Medicine & { medicine_schedules?: MedicineSchedule[] }
  onSave: () => void
  onCancel: () => void
}

export function MedicineForm({ medicine, onSave, onCancel }: Props) {
  const isEdit = !!medicine
  const createMed = useCreateMedicine()
  const updateMed = useUpdateMedicine()
  const saveSchedules = useSaveSchedules()

  const [name, setName] = useState(medicine?.name ?? '')
  const [brand, setBrand] = useState(medicine?.brand_name ?? '')
  const [strength, setStrength] = useState(medicine?.strength ?? '')
  const [form, setForm] = useState<DosageForm>(medicine?.dosage_form ?? 'tablet')
  const [stockUnit, setStockUnit] = useState(medicine?.stock_unit ?? 'tablet')
  const [instructions, setInstructions] = useState(medicine?.instructions ?? '')
  const [prescriptionNotes, setPrescriptionNotes] = useState(medicine?.prescription_notes ?? '')
  const [refillNotes, setRefillNotes] = useState(medicine?.refill_notes ?? '')
  const [currentStock, setCurrentStock] = useState(medicine?.current_stock?.toString() ?? '0')
  const [threshold, setThreshold] = useState(medicine?.stock_threshold_days?.toString() ?? '5')
  const [showMore, setShowMore] = useState(false)

  const [schedules, setSchedules] = useState<ScheduleInput[]>(
    medicine?.medicine_schedules?.filter(s => s.active).map(s => ({
      time_period: s.time_period,
      quantity_per_dose: s.quantity_per_dose,
      scheduled_time: s.scheduled_time ?? '',
      applicable_days: s.applicable_days ?? [],
    })) ?? []
  )

  function addSchedule(period: TimePeriod) {
    if (schedules.find(s => s.time_period === period)) return
    setSchedules(prev => [...prev, { time_period: period, quantity_per_dose: 1, scheduled_time: '', applicable_days: [] }])
  }

  function removeSchedule(period: TimePeriod) {
    setSchedules(prev => prev.filter(s => s.time_period !== period))
  }

  function updateSchedule(period: TimePeriod, field: keyof ScheduleInput, value: any) {
    setSchedules(prev => prev.map(s => s.time_period === period ? { ...s, [field]: value } : s))
  }

  function toggleDay(period: TimePeriod, day: string) {
    const s = schedules.find(sc => sc.time_period === period)
    if (!s) return
    const days = s.applicable_days.includes(day)
      ? s.applicable_days.filter(d => d !== day)
      : [...s.applicable_days, day]
    updateSchedule(period, 'applicable_days', days)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const medPayload = {
      name: name.trim(),
      brand_name: brand.trim() || null,
      strength: strength.trim() || null,
      dosage_form: form,
      stock_unit: stockUnit.trim() || 'tablet',
      instructions: instructions.trim() || null,
      prescription_notes: prescriptionNotes.trim() || null,
      refill_notes: refillNotes.trim() || null,
      current_stock: parseFloat(currentStock) || 0,
      stock_threshold_days: parseInt(threshold) || 5,
      active: true,
      archived_at: null,
      // new fields — defaults when adding via form
      category: medicine?.category ?? null,
      is_critical: medicine?.is_critical ?? false,
      needs_confirmation: medicine?.needs_confirmation ?? false,
      confirmation_notes: medicine?.confirmation_notes ?? null,
      preferred_brand: medicine?.preferred_brand ?? null,
    }

    const schedulePayload = schedules.map(s => ({
      time_period: s.time_period,
      quantity_per_dose: s.quantity_per_dose,
      scheduled_time: s.scheduled_time || null,
      applicable_days: s.applicable_days.length > 0 ? s.applicable_days : null,
      active: true,
    }))

    if (isEdit && medicine) {
      await updateMed.mutateAsync({ id: medicine.id, updates: medPayload })
      await saveSchedules.mutateAsync({ medicineId: medicine.id, schedules: schedulePayload })
    } else {
      await createMed.mutateAsync({ medicine: medPayload, schedules: schedulePayload })
    }
    onSave()
  }

  const isSaving = createMed.isPending || updateMed.isPending || saveSchedules.isPending
  const saveError = createMed.error || updateMed.error || saveSchedules.error

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Medicine name *</label>
        <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Metformin" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Dosage form</label>
          <select className="input-field" value={form} onChange={e => setForm(e.target.value as DosageForm)}>
            {DOSAGE_FORMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Stock unit</label>
          <input className="input-field" value={stockUnit} onChange={e => setStockUnit(e.target.value)} placeholder="tablet, ml…" />
        </div>
      </div>
      <div>
        <label className="label">Prescribed instructions</label>
        <input className="input-field" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Take after food" />
      </div>

      {!isEdit && (
        <div>
          <label className="label">Current stock</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.5" className="input-field flex-1" value={currentStock} onChange={e => setCurrentStock(e.target.value)} />
            <span className="text-warm-500 text-sm">{stockUnit}</span>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div>
        <label className="label">Daily schedule</label>
        <div className="space-y-3">
          {TIME_PERIODS.map(({ value, label, icon }) => {
            const sched = schedules.find(s => s.time_period === value)
            return (
              <div key={value} className={cn('rounded-xl border p-3 transition-colors', sched ? 'border-brand-200 bg-brand-50' : 'border-warm-200 bg-warm-50')}>
                {sched ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-warm-800">{icon} {label}</span>
                      <button type="button" onClick={() => removeSchedule(value)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs">Quantity per dose</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number" min="0.5" step="0.5"
                            className="input-field py-2 text-sm"
                            value={sched.quantity_per_dose}
                            onChange={e => updateSchedule(value, 'quantity_per_dose', parseFloat(e.target.value) || 1)}
                          />
                          <span className="text-xs text-warm-500 whitespace-nowrap">{stockUnit}</span>
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">Specific time (opt)</label>
                        <input
                          type="time"
                          className="input-field py-2 text-sm"
                          value={sched.scheduled_time}
                          onChange={e => updateSchedule(value, 'scheduled_time', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label text-xs">Days (leave empty for every day)</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day} type="button"
                            onClick={() => toggleDay(value, day)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-full font-medium border transition-colors',
                              sched.applicable_days.includes(day)
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'bg-white text-warm-500 border-warm-200 hover:border-brand-300'
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => addSchedule(value)}
                    className="w-full flex items-center gap-2 text-warm-400 hover:text-brand-600 text-sm py-1">
                    <Plus size={15} />
                    <span>{icon} Add {label} dose</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* More details */}
      <button type="button" onClick={() => setShowMore(v => !v)}
        className="flex items-center gap-1 text-sm text-warm-500 hover:text-warm-700">
        {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {showMore ? 'Hide extra details' : 'Add more details (optional)'}
      </button>

      {showMore && (
        <div className="space-y-4 pt-1">
          <div>
            <label className="label">Brand name</label>
            <input className="input-field" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Glucophage" />
          </div>
          <div>
            <label className="label">Strength</label>
            <input className="input-field" value={strength} onChange={e => setStrength(e.target.value)} placeholder="e.g. 500 mg" />
          </div>
          <div>
            <label className="label">Low-stock warning threshold (days)</label>
            <input type="number" min="1" max="30" className="input-field" value={threshold} onChange={e => setThreshold(e.target.value)} />
          </div>
          <div>
            <label className="label">Prescription notes</label>
            <textarea className="input-field resize-none" rows={2} value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)} />
          </div>
          <div>
            <label className="label">Refill notes</label>
            <textarea className="input-field resize-none" rows={2} value={refillNotes} onChange={e => setRefillNotes(e.target.value)} />
          </div>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          {(saveError as any)?.message ?? 'Failed to save. Please try again.'}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isSaving} className="btn-primary flex-1">
          {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Add Medicine'}
        </button>
      </div>
    </form>
  )
}
