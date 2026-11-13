import { useState } from 'react'
import { LogOut, Loader2, User, Download, Smile, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useSeedMedicines } from '@/hooks/useSeedMedicines'
import { useMedicines } from '@/hooks/useMedicines'
import { supabase } from '@/lib/supabase'
import { MemojiAvatar } from '@/components/common/MemojiAvatar'

function AvatarPicker({
  currentIndex,
  seed,
  onPick,
  onClose,
}: {
  currentIndex: number | null
  seed: string
  onPick: (idx: number) => void
  onClose: () => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const selected = currentIndex

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl pb-8 pt-5 px-5 animate-slide-up"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#C7C7CC' }} />
        <p className="text-sm font-bold text-warm-800 text-center mb-4">Choose your avatar</p>

        {/* 7 × 7 grid of all 45 avatars */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 45 }, (_, i) => {
            const isSelected = selected === i
            const isHovered = hoveredIdx === i
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex items-center justify-center transition-transform duration-150"
                style={{
                  borderRadius: 12,
                  outline: isSelected ? '2.5px solid #D4A843' : isHovered ? '2px solid rgba(212,168,67,0.5)' : '2px solid transparent',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isSelected ? '0 2px 10px rgba(212,168,67,0.4)' : 'none',
                }}
              >
                <MemojiAvatar seed={seed} avatarIndex={i} size={40} rounded="xl" />
                {isSelected && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#D4A843' }}
                  >
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const seedMeds = useSeedMedicines()
  const { data: medicines = [] } = useMedicines()
  const [seedDone, setSeedDone] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)

  const displayName = profile?.display_name ?? profile?.caregiver_name ?? 'You'

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

  async function handlePickAvatar(idx: number) {
    if (!profile) return
    setSavingAvatar(true)
    setShowAvatarPicker(false)
    await (supabase as any)
      .from('profiles')
      .update({ avatar_index: idx })
      .eq('user_id', profile.user_id)
    await refreshProfile()
    setSavingAvatar(false)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-warm-800">Settings</h1>

      {/* Avatar section */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-700 flex items-center gap-2"><Smile size={16} /> Your Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <MemojiAvatar
              seed={displayName}
              size={64}
              rounded="2xl"
              avatarIndex={profile?.avatar_index ?? null}
            />
            {savingAvatar && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.7)' }}>
                <Loader2 size={18} className="animate-spin text-brand-500" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-warm-800">{displayName}</p>
            <p className="text-xs text-warm-400 mt-0.5">
              {profile?.avatar_index != null ? `Avatar #${profile.avatar_index + 1}` : 'Default avatar'}
            </p>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(212,168,67,0.1)', color: '#B45309', border: '1px solid rgba(212,168,67,0.25)' }}
            >
              Change Avatar
            </button>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-700 flex items-center gap-2"><User size={16} /> Patient &amp; Caregiver</h2>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-warm-400 font-medium">Patient</span>
          <span className="text-sm font-semibold text-warm-800">{profile?.patient_name ?? 'Dr Nikkie'}</span>
        </div>
        <div className="flex items-center justify-between py-1 border-t border-warm-50">
          <span className="text-xs text-warm-400 font-medium">Your name</span>
          <span className="text-sm font-semibold text-warm-800">{displayName}</span>
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

      {showAvatarPicker && (
        <AvatarPicker
          currentIndex={profile?.avatar_index ?? null}
          seed={displayName}
          onPick={handlePickAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  )
}
