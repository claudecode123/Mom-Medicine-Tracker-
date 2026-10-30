import { useState } from 'react'
import { CheckSquare, Square, X, Loader2, CheckCircle, ChevronDown } from 'lucide-react'
import { useRecordDose } from '@/hooks/useDoses'
import { useAlternativeBrands } from '@/hooks/useAlternativeBrands'
import type { DoseRecord, TimePeriod } from '@/types/database'

interface DoseItem {
  dose: DoseRecord & { medicines: any }
  schedule: { id: string; time_period: TimePeriod; quantity_per_dose: number } | null
}

interface Props {
  periodLabel: string
  items: DoseItem[]
  onClose: () => void
}

function MedicineRow({
  item,
  checked,
  onToggle,
  brand,
  onBrandChange,
  disabled,
}: {
  item: DoseItem
  checked: boolean
  onToggle: () => void
  brand: string | null
  onBrandChange: (b: string) => void
  disabled: boolean
}) {
  const med = item.dose.medicines
  const { data: altBrands = [] } = useAlternativeBrands(med.id)
  const hasBrands = altBrands.length > 0

  return (
    <div className={`rounded-2xl border transition-colors ${checked ? 'bg-brand-50 border-brand-200' : 'bg-warm-50 border-warm-100'}`}>
      <button
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {checked
          ? <CheckSquare size={20} className="text-brand-500 flex-shrink-0" />
          : <Square size={20} className="text-warm-300 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-warm-800 text-sm">{med.name}</p>
          <p className="text-xs text-warm-400">
            {med.strength && `${med.strength} · `}
            {item.schedule?.quantity_per_dose} {med.stock_unit}
            {med.instructions && ` · ${med.instructions}`}
          </p>
        </div>
      </button>

      {/* Brand selector — only when medicine has alternatives */}
      {checked && hasBrands && (
        <div className="px-3 pb-3">
          <div className="relative">
            <select
              value={brand ?? ''}
              onChange={e => onBrandChange(e.target.value)}
              disabled={disabled}
              className="w-full text-xs appearance-none bg-white border border-warm-200 rounded-xl px-3 py-2 pr-8 text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {altBrands.map(b => (
                <option key={b.id} value={b.brand_name}>{b.brand_name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  )
}

export function BulkRecordModal({ periodLabel, items, onClose }: Props) {
  const actionableItems = items.filter(
    i => i.schedule && (i.dose.status === 'pending' || i.dose.status === 'overdue')
  )

  const [selected, setSelected] = useState<Set<string>>(
    new Set(actionableItems.map(i => i.dose.id))
  )
  const [brands, setBrands] = useState<Record<string, string | null>>(
    Object.fromEntries(
      actionableItems.map(i => [i.dose.id, (i.dose.medicines as any).preferred_brand ?? null])
    )
  )
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState(false)
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)

  const recordDose = useRecordDose()

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(
      selected.size === actionableItems.length
        ? new Set()
        : new Set(actionableItems.map(i => i.dose.id))
    )
  }

  async function handleRecord() {
    const toRecord = actionableItems.filter(i => selected.has(i.dose.id))
    if (toRecord.length === 0) return
    setRecording(true)
    let count = 0
    for (const { dose, schedule } of toRecord) {
      if (!schedule) continue
      try {
        await recordDose.mutateAsync({
          medicineId: dose.medicine_id,
          scheduleId: schedule.id,
          scheduledPeriod: dose.scheduled_period as TimePeriod,
          scheduledFor: dose.scheduled_for,
          quantityAdministered: schedule.quantity_per_dose,
          photo: null,
          notes: notes.trim() || null,
          brandUsed: brands[dose.id] ?? null,
        })
        count++
        setProgress(count)
      } catch {
        // continue with others even if one fails
      }
    }
    setDone(true)
    setRecording(false)
    setTimeout(onClose, 1200)
  }

  const selectedCount = selected.size
  const total = actionableItems.length

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-warm-800">Log {periodLabel} Doses</h2>
            <p className="text-sm text-warm-500">{selectedCount} of {total} selected</p>
          </div>
          <button onClick={onClose} disabled={recording}
            className="w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center text-warm-500 hover:bg-warm-200">
            <X size={18} />
          </button>
        </div>

        {/* Select all */}
        <button onClick={toggleAll} disabled={recording}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 w-full text-left">
          {selected.size === total
            ? <CheckSquare size={18} className="text-brand-500" />
            : <Square size={18} className="text-warm-400" />}
          {selected.size === total ? 'Deselect all' : 'Select all'}
        </button>

        <div className="border-t border-warm-100" />

        {/* Medicine list */}
        <div className="overflow-y-auto max-h-72 px-5 py-3 space-y-2">
          {actionableItems.map(item => (
            <MedicineRow
              key={item.dose.id}
              item={item}
              checked={selected.has(item.dose.id)}
              onToggle={() => toggle(item.dose.id)}
              brand={brands[item.dose.id] ?? null}
              onBrandChange={b => setBrands(prev => ({ ...prev, [item.dose.id]: b }))}
              disabled={recording}
            />
          ))}
        </div>

        {/* Notes */}
        <div className="px-5 pb-3">
          <input
            type="text"
            placeholder="Notes (optional, applies to all)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={recording}
            className="input-field text-sm"
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-2">
          {done ? (
            <div className="btn-primary w-full justify-center gap-2 bg-green-500 pointer-events-none">
              <CheckCircle size={18} /> All recorded!
            </div>
          ) : (
            <button
              onClick={handleRecord}
              disabled={recording || selectedCount === 0}
              className="btn-primary w-full justify-center gap-2">
              {recording
                ? <><Loader2 size={18} className="animate-spin" /> Recording {progress}/{selectedCount}…</>
                : <>Record {selectedCount} Medicine{selectedCount !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
