import { useState } from 'react'
import { LogOut, Loader2, User, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useSeedMedicines } from '@/hooks/useSeedMedicines'
import { useMedicines } from '@/hooks/useMedicines'

export function SettingsPage() {
  const { profile, signOut } = useAuth()
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

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-warm-800">Settings</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-700 flex items-center gap-2"><User size={16} /> Patient & Caregiver</h2>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-warm-400 font-medium">Patient</span>
          <span className="text-sm font-semibold text-warm-800">{profile?.patient_name ?? 'Dr Nikkie'}</span>
        </div>
        <div className="flex items-center justify-between py-1 border-t border-warm-50">
          <span className="text-xs text-warm-400 font-medium">Your name</span>
          <span className="text-sm font-semibold text-warm-800">{profile?.display_name ?? profile?.caregiver_name ?? '—'}</span>
        </div>
      </div>

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
