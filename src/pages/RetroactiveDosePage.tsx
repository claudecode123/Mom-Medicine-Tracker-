import { useState } from 'react'
import { ClockArrowUp, ChevronLeft, ChevronRight, CheckCircle, Minus, AlertTriangle, Loader2, Save } from 'lucide-react'
import { OrganIconChip } from '@/components/common/OrganIconChip'
import { useMedicines } from '@/hooks/useMedicines'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TIME_PERIODS, type TimePeriod } from '@/lib/utils'
import { format, subDays, addDays, parseISO } from 'date-fns'

const periodScheduledTime: Record<TimePeriod, string> = {
  early_morning: '06:00:00',
  morning: '08:00:00',
  afternoon: '13:00:00',
  evening: '20:00:00',
}

function dateLabel(d: Date) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const ds = format(d, 'yyyy-MM-dd')
  if (ds === today) return 'Today'
  if (ds === yesterday) return 'Yesterday'
  return format(d, 'EEE, d MMM')
}

type DoseStatus = 'given' | 'skipped' | 'pending'

interface DoseEntry {
  medicineId: string
  medicineName: string
  strength: string | null
  scheduleId: string
  defaultQty: number
  stockUnit: string
  status: DoseStatus
  existingRecordId?: string
  quantity: number
  notes: string
  correctionReason: string
}

function useDosesForDatePeriod(date: string, period: TimePeriod) {
  return useQuery({
    queryKey: ['doses', 'retro', date, period],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('dose_records')
        .select('*')
        .gte('scheduled_for', `${date}T00:00:00`)
        .lte('scheduled_for', `${date}T23:59:59`)
        .eq('scheduled_period', period)
      if (error) throw error
      return data as any[]
    },
  })
}

export function RetroactiveDosePage() {
  const { user, profile } = useAuth()
  const qc = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(() => subDays(new Date(), 1))
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('morning')
  const [entries, setEntries] = useState<DoseEntry[]>([])
  const [initialized, setInitialized] = useState(false)
  const [saved, setSaved] = useState(false)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const { data: medicines = [] } = useMedicines()
  const { data: existingDoses = [], isLoading: dosesLoading } = useDosesForDatePeriod(dateStr, activePeriod)

  function initEntries() {
    const periodMeds: DoseEntry[] = []
    for (const m of medicines) {
      const sched = m.medicine_schedules?.find(
        (s: any) => s.time_period === activePeriod && s.active !== false
      )
      if (!sched) continue
      const existing = existingDoses.find((d: any) => d.medicine_id === m.id && d.scheduled_period === activePeriod)
      periodMeds.push({
        medicineId: m.id,
        medicineName: m.name,
        strength: m.strength,
        scheduleId: sched.id,
        defaultQty: sched.quantity_per_dose,
        stockUnit: m.stock_unit,
        status: (existing?.status ?? 'pending') as DoseStatus,
        existingRecordId: existing?.id,
        quantity: existing?.quantity_administered ?? sched.quantity_per_dose,
        notes: existing?.notes ?? '',
        correctionReason: '',
      })
    }
    setEntries(periodMeds)
    setInitialized(true)
    setSaved(false)
  }

  // Re-init when date/period/doses change
  if (!initialized && !dosesLoading && medicines.length > 0) {
    initEntries()
  }

  function resetInit() {
    setInitialized(false)
  }

  function changeDate(delta: number) {
    setSelectedDate(d => {
      const next = delta > 0 ? addDays(d, 1) : subDays(d, 1)
      if (next > new Date()) return d
      return next
    })
    resetInit()
  }

  function changePeriod(p: TimePeriod) {
    setActivePeriod(p)
    resetInit()
  }

  function updateEntry(idx: number, patch: Partial<DoseEntry>) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const scheduledTime = periodScheduledTime[activePeriod]
      const scheduledFor = `${dateStr}T${scheduledTime}`

      for (const entry of entries) {
        if (entry.status === 'pending') continue

        const record = {
          medicine_id: entry.medicineId,
          schedule_id: entry.scheduleId,
          scheduled_period: activePeriod,
          scheduled_for: scheduledFor,
          status: entry.status,
          quantity_administered: entry.status === 'given' ? entry.quantity : null,
          administered_at: entry.status === 'given' ? new Date().toISOString() : null,
          notes: entry.notes || null,
          correction_reason: entry.correctionReason || 'Retroactive entry',
          created_by: user!.id,
          updated_at: new Date().toISOString(),
        }

        if (entry.existingRecordId) {
          const { error } = await (supabase as any)
            .from('dose_records')
            .update(record)
            .eq('id', entry.existingRecordId)
          if (error) throw error
        } else {
          const { error } = await (supabase as any)
            .from('dose_records')
            .insert({ ...record, created_at: new Date().toISOString() })
          if (error) throw error
        }
      }

      // Write immutable edit log entries
      const logEntries = entries
        .filter(e => e.status !== 'pending')
        .map(e => ({
          edited_at: new Date().toISOString(),
          edited_by_user_id: user!.id,
          edited_by_name: profile?.display_name ?? profile?.caregiver_name ?? 'Admin',
          dose_date: dateStr,
          period: activePeriod,
          medicine_name: e.medicineName,
          medicine_strength: e.strength ?? null,
          action: e.status,
          quantity: e.status === 'given' ? e.quantity : null,
          notes: e.notes || null,
          correction_reason: e.correctionReason || 'Retroactive entry',
          dose_record_id: e.existingRecordId ?? null,
        }))
      if (logEntries.length > 0) {
        await (supabase as any).from('dose_edit_logs').insert(logEntries)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doses'] })
      setSaved(true)
      resetInit()
    },
  })

  const activePeriodInfo = TIME_PERIODS.find(p => p.value === activePeriod)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <ClockArrowUp size={20} className="text-brand-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-warm-800">Edit Past Doses</h1>
          <p className="text-xs text-warm-400">Admin · Add or correct dose records</p>
        </div>
      </div>

      {/* Date picker */}
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="w-9 h-9 rounded-xl bg-warm-50 flex items-center justify-center text-warm-500 hover:bg-warm-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-warm-800">{dateLabel(selectedDate)}</p>
            <p className="text-xs text-warm-400">{format(selectedDate, 'EEEE, d MMMM yyyy')}</p>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
            className="w-9 h-9 rounded-xl bg-warm-50 flex items-center justify-center text-warm-500 hover:bg-warm-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TIME_PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => changePeriod(p.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
              activePeriod === p.value
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-warm-100 text-warm-500 bg-white hover:border-warm-300'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2.5">
        <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Retroactive entries are logged with a correction reason. Stock levels are <strong>not</strong> adjusted for past edits.
        </p>
      </div>

      {/* Dose entries */}
      {dosesLoading || !initialized ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-warm-400 text-sm text-center py-8">No medicines scheduled for {activePeriodInfo?.label}.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div key={entry.medicineId} className={`card space-y-3 border-2 transition-colors ${
              entry.status === 'given' ? 'border-green-200 bg-green-50/30' :
              entry.status === 'skipped' ? 'border-warm-200 bg-warm-50/50' :
              'border-warm-100'
            }`}>
              {/* Medicine header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <OrganIconChip name={entry.medicineName} size={32} radius={8} />
                  <div>
                    <p className="font-semibold text-warm-800 text-sm">{entry.medicineName}</p>
                    {entry.strength && <p className="text-xs text-warm-400">{entry.strength}</p>}
                  </div>
                </div>
                {/* Status toggle */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateEntry(idx, { status: 'given' })}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      entry.status === 'given'
                        ? 'bg-green-500 text-white'
                        : 'bg-warm-100 text-warm-500 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    <CheckCircle size={12} /> Given
                  </button>
                  <button
                    onClick={() => updateEntry(idx, { status: 'skipped' })}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      entry.status === 'skipped'
                        ? 'bg-warm-500 text-white'
                        : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
                    }`}
                  >
                    <Minus size={12} /> Skip
                  </button>
                </div>
              </div>

              {entry.status !== 'pending' && (
                <>
                  {entry.status === 'given' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-warm-500 w-16 flex-shrink-0">Qty</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={entry.quantity}
                        onChange={e => updateEntry(idx, { quantity: parseFloat(e.target.value) || entry.defaultQty })}
                        className="input-field flex-1 text-sm py-1.5"
                      />
                      <span className="text-xs text-warm-400">{entry.stockUnit}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <label className="text-xs text-warm-500 w-16 flex-shrink-0 mt-1.5">Notes</label>
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={e => updateEntry(idx, { notes: e.target.value })}
                      className="input-field flex-1 text-sm py-1.5"
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <label className="text-xs text-warm-500 w-16 flex-shrink-0 mt-1.5">Reason</label>
                    <input
                      type="text"
                      value={entry.correctionReason}
                      onChange={e => updateEntry(idx, { correctionReason: e.target.value })}
                      className="input-field flex-1 text-sm py-1.5"
                      placeholder="e.g. Forgot to log"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      {initialized && entries.length > 0 && (
        <div className="pb-4">
          {saved ? (
            <div className="btn-primary w-full justify-center gap-2 bg-green-500 pointer-events-none">
              <CheckCircle size={18} /> Saved!
            </div>
          ) : (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || entries.every(e => e.status === 'pending')}
              className="btn-primary w-full justify-center gap-2"
            >
              {saveMutation.isPending
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <><Save size={16} /> Save Changes</>
              }
            </button>
          )}
          {saveMutation.isError && (
            <p className="text-red-600 text-sm mt-2 text-center">
              {(saveMutation.error as any)?.message ?? 'Failed to save. Please try again.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
