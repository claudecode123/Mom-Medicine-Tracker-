import { useState } from 'react'
import { Plus, Stethoscope, Calendar, Edit, Trash2, Loader2, X } from 'lucide-react'
import { useDoctorVisits, useCreateVisit, useUpdateVisit, useDeleteVisit } from '@/hooks/useDoctorVisits'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { format, parseISO } from 'date-fns'
import type { DoctorVisit } from '@/types/database'

type View = 'list' | 'add' | 'edit'

function VisitForm({ visit, onSave, onCancel }: { visit?: DoctorVisit; onSave: () => void; onCancel: () => void }) {
  const createVisit = useCreateVisit()
  const updateVisit = useUpdateVisit()

  const [doctorName, setDoctorName] = useState(visit?.doctor_name ?? '')
  const [clinicName, setClinicName] = useState(visit?.clinic_name ?? '')
  const [visitDate, setVisitDate] = useState(visit?.visit_date ?? format(new Date(), 'yyyy-MM-dd'))
  const [reason, setReason] = useState(visit?.reason ?? '')
  const [summary, setSummary] = useState(visit?.visit_summary ?? '')
  const [followUp, setFollowUp] = useState(visit?.follow_up_date ?? '')
  const [prescriptionNotes, setPrescriptionNotes] = useState(visit?.prescription_notes ?? '')
  const [nextNotes, setNextNotes] = useState(visit?.notes_for_next ?? '')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSaving = createVisit.isPending || updateVisit.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!doctorName.trim()) return
    setError(null)
    try {
      const payload = {
        doctor_name: doctorName.trim(),
        clinic_name: clinicName.trim() || null,
        visit_date: visitDate,
        reason: reason.trim() || null,
        visit_summary: summary.trim() || null,
        follow_up_date: followUp || null,
        prescription_notes: prescriptionNotes.trim() || null,
        notes_for_next: nextNotes.trim() || null,
      }
      if (visit) {
        await updateVisit.mutateAsync({ id: visit.id, updates: payload })
      } else {
        await createVisit.mutateAsync({ visit: payload, attachment })
      }
      onSave()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="label">Doctor's name *</label>
          <input className="input-field" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Sharma" required />
        </div>
        <div>
          <label className="label">Clinic / Hospital</label>
          <input className="input-field" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Apollo Clinic, Mumbai" />
        </div>
        <div>
          <label className="label">Visit date *</label>
          <input type="date" className="input-field" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Reason for visit</label>
          <input className="input-field" value={reason} onChange={e => setReason(e.target.value)} placeholder="Routine check-up, blood test review…" />
        </div>
        <div>
          <label className="label">What the doctor said</label>
          <textarea className="input-field resize-none" rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary of the consultation…" />
        </div>
        <div>
          <label className="label">Follow-up date</label>
          <input type="date" className="input-field" value={followUp} onChange={e => setFollowUp(e.target.value)} />
        </div>
        <div>
          <label className="label">Prescription notes</label>
          <textarea className="input-field resize-none" rows={2} value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)} />
        </div>
        <div>
          <label className="label">Notes for next visit</label>
          <textarea className="input-field resize-none" rows={2} value={nextNotes} onChange={e => setNextNotes(e.target.value)} placeholder="Questions to ask, things to bring…" />
        </div>
        {!visit && (
          <div>
            <label className="label">Prescription photo (optional)</label>
            <input type="file" accept="image/*" className="input-field text-sm py-2"
              onChange={e => setAttachment(e.target.files?.[0] ?? null)} />
          </div>
        )}
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isSaving} className="btn-primary flex-1">
          {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : visit ? 'Save Changes' : 'Add Visit'}
        </button>
      </div>
    </form>
  )
}

export function DoctorVisitsPage() {
  const { data: visits, isLoading } = useDoctorVisits()
  const deleteVisit = useDeleteVisit()
  const [view, setView] = useState<View>('list')
  const [editingVisit, setEditingVisit] = useState<DoctorVisit | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  if (isLoading) return <PageLoader />

  if (view === 'add') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-xl font-bold text-warm-800">Add Doctor Visit</h1>
        </div>
        <div className="card">
          <VisitForm onSave={() => setView('list')} onCancel={() => setView('list')} />
        </div>
      </div>
    )
  }

  if (view === 'edit' && editingVisit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setEditingVisit(null) }} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-xl font-bold text-warm-800">Edit Visit</h1>
        </div>
        <div className="card">
          <VisitForm visit={editingVisit} onSave={() => { setView('list'); setEditingVisit(null) }} onCancel={() => { setView('list'); setEditingVisit(null) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-800">Doctor Visits</h1>
        <button onClick={() => setView('add')} className="btn-primary px-4 py-2.5 text-sm">
          <Plus size={16} /> Add Visit
        </button>
      </div>

      {!visits || visits.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No visits recorded yet"
          description="Keep track of doctor appointments, prescriptions, and follow-up dates."
          action={<button onClick={() => setView('add')} className="btn-primary">Add Visit</button>}
        />
      ) : (
        <div className="space-y-4">
          {visits.map(visit => (
            <div key={visit.id} className="card border border-warm-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-warm-800">{visit.doctor_name}</p>
                      {visit.clinic_name && <p className="text-sm text-warm-500">{visit.clinic_name}</p>}
                    </div>
                    <p className="text-sm text-warm-500 flex-shrink-0">
                      {format(parseISO(visit.visit_date), 'd MMM yyyy')}
                    </p>
                  </div>
                  {visit.reason && (
                    <p className="text-sm text-warm-600 mt-1">📋 {visit.reason}</p>
                  )}
                  {visit.visit_summary && (
                    <p className="text-sm text-warm-600 mt-1 line-clamp-2">{visit.visit_summary}</p>
                  )}
                  {visit.follow_up_date && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                      <Calendar size={11} />
                      Follow-up: {format(parseISO(visit.follow_up_date), 'd MMM yyyy')}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setEditingVisit(visit); setView('edit') }}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(visit.id)}
                      className="text-red-400 hover:text-red-600 text-xs py-1.5 px-2 flex items-center gap-1 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                  {deleteConfirm === visit.id && (
                    <div className="mt-2 bg-red-50 rounded-xl p-3 space-y-2">
                      <p className="text-sm text-red-700">Delete this visit record? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
                        <button onClick={async () => { await deleteVisit.mutateAsync(visit.id); setDeleteConfirm(null) }}
                          className="btn-danger flex-1 text-xs py-1.5">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
