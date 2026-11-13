import { useState } from 'react'
import { LogOut, Save, Loader2, User, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useSeedMedicines } from '@/hooks/useSeedMedicines'
import { useMedicines } from '@/hooks/useMedicines'

export function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const seedMeds = useSeedMedicines()
  const { data: medicines = [] } = useMedicines()
  const [seedDone, setSeedDone] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)

  async function handleSeed() {
    setSeedError(null)
    try {
      await seedMeds.mutateAsync()
      setSeedDone(true)
      setTimeout(() => setSeedDone(false), 4000)
    } catch (err: any) {
      setSeedError(err?.message ?? 'Failed to load medicines')
    }
  }

  const [patientName, setPatientName] = useState(profile?.patient_name ?? 'Mom')
  const [caregiverName, setCaregiverName] = useState(profile?.caregiver_name ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [threshold, setThreshold] = useState(profile?.low_stock_threshold_days?.toString() ?? '5')
  const [requirePhoto, setRequirePhoto] = useState(profile?.require_photo_for_dose ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error: upsertError } = await (supabase as any).from('profiles').upsert({
        user_id: user!.id,
        patient_name: patientName.trim() || 'Mom',
        caregiver_name: caregiverName.trim() || null,
        timezone,
        low_stock_threshold_days: parseInt(threshold) || 5,
        require_photo_for_dose: requirePhoto,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (upsertError) throw upsertError
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save settings.')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-warm-800">Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold text-warm-700 flex items-center gap-2"><User size={16} /> Patient & Caregiver</h2>
          <div>
            <label className="label">Patient name</label>
            <input className="input-field" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Mom" />
            <p className="text-xs text-warm-400 mt-1">Used in greetings and display</p>
          </div>
          <div>
            <label className="label">Your name (caregiver)</label>
            <input className="input-field" value={caregiverName} onChange={e => setCaregiverName(e.target.value)} placeholder="Your name" />
          </div>
        </div>


{error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {saved && <p className="text-brand-700 text-sm bg-brand-50 rounded-xl px-4 py-3">✅ Settings saved!</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Settings</>}
        </button>
      </form>

      {/* Seed medicines */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-700 flex items-center gap-2"><Download size={16} /> Load Medicine List</h2>
        <p className="text-sm text-warm-500">
          Load the pre-configured medicine schedule (12 medicines, all time periods). Safe to run — will not duplicate if already loaded.
        </p>
        {medicines.length > 0 && (
          <p className="text-xs text-warm-400">You already have {medicines.length} medicine(s). This will add any missing ones.</p>
        )}
        {seedDone && <p className="text-brand-700 text-sm bg-brand-50 rounded-xl px-4 py-3">✅ Medicine list loaded!</p>}
        {seedError && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{seedError}</p>}
        <button onClick={handleSeed} disabled={seedMeds.isPending} className="btn-primary w-full">
          {seedMeds.isPending ? <><Loader2 size={16} className="animate-spin" /> Loading…</> : 'Load Mom\'s Medicine List'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold text-warm-700 mb-3">Account</h2>
        <button onClick={handleSignOut} className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <p className="text-xs text-warm-400 text-center pb-4">
        Mom's Medicine Tracker · Private family use
      </p>
    </div>
  )
}
