import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle, Camera, ChevronRight, SkipForward } from 'lucide-react'
import { RecordDoseModal } from './RecordDoseModal'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DoseRecord, TimePeriod } from '@/types/database'

interface Props {
  dose: DoseRecord & {
    medicines: {
      id: string; name: string; brand_name: string | null; strength: string | null
      dosage_form: string; stock_unit: string; instructions: string | null; current_stock: number
    }
  }
  schedule: { id: string; time_period: TimePeriod; quantity_per_dose: number } | null
  requirePhoto?: boolean
}

const statusConfig = {
  given:   { icon: CheckCircle, bg: 'bg-brand-50',  border: 'border-brand-200',  badge: 'badge-given',   label: 'Given' },
  pending: { icon: Clock,       bg: 'bg-white',      border: 'border-warm-200',   badge: 'badge-pending', label: 'Pending' },
  overdue: { icon: AlertCircle, bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'badge-overdue', label: 'Overdue' },
  skipped: { icon: SkipForward, bg: 'bg-warm-50',    border: 'border-warm-200',   badge: 'badge-skipped', label: 'Skipped' },
}

export function DoseCard({ dose, schedule, requirePhoto }: Props) {
  const [showModal, setShowModal] = useState(false)
  const med = dose.medicines
  const cfg = statusConfig[dose.status as keyof typeof statusConfig] ?? statusConfig.pending
  const Icon = cfg.icon

  const isActionable = dose.status === 'pending' || dose.status === 'overdue'
  const scheduledTime = dose.scheduled_for ? format(new Date(dose.scheduled_for), 'h:mm a') : null

  return (
    <>
      <div className={cn('card border flex gap-3', cfg.bg, cfg.border)}>
        <div className={cn('mt-0.5', dose.status === 'given' ? 'text-brand-500' : dose.status === 'overdue' ? 'text-amber-500' : 'text-warm-300')}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-warm-800 truncate">{med.name}</p>
              {med.strength && <p className="text-xs text-warm-400">{med.strength}</p>}
            </div>
            <span className={cfg.badge}>{cfg.label}</span>
          </div>

          {med.instructions && (
            <p className="text-sm text-warm-500 mt-1 italic">"{med.instructions}"</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-warm-400">
            {schedule && (
              <span>{schedule.quantity_per_dose} {med.stock_unit}</span>
            )}
            {scheduledTime && <span>· {scheduledTime}</span>}
            {dose.status === 'given' && dose.photo_storage_path && (
              <span className="flex items-center gap-1 text-brand-500"><Camera size={11} /> Photo</span>
            )}
            {dose.status === 'given' && !dose.photo_storage_path && (
              <span className="text-amber-500">No photo</span>
            )}
          </div>

          {dose.status === 'given' && dose.administered_at && (
            <p className="text-xs text-warm-400 mt-1">
              Given at {format(new Date(dose.administered_at), 'h:mm a')}
              {dose.quantity_administered && ` · ${dose.quantity_administered} ${med.stock_unit}`}
              {(dose as any).brand_used && ` · ${(dose as any).brand_used}`}
            </p>
          )}

          {isActionable && schedule && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary w-full mt-3 text-sm py-2.5"
            >
              Record Dose
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {showModal && schedule && (
        <RecordDoseModal
          medicine={med}
          schedule={schedule}
          scheduledFor={dose.scheduled_for}
          onClose={() => setShowModal(false)}
          requirePhoto={requirePhoto}
        />
      )}
    </>
  )
}
