import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { MemojiAvatar } from '@/components/common/MemojiAvatar'

interface FamilyMember {
  user_id: string
  display_name: string
  role: 'admin' | 'user'
  relation: string | null
  email: string
  avatar_index?: number | null
}

export function LoginPage() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selected, setSelected] = useState<FamilyMember | null>(null)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (session) navigate('/') }, [session])

  useEffect(() => {
    async function load() {
      setLoadingMembers(true)
      const { data } = await (supabase as any).rpc('get_family_members')
      if (data) {
        const sorted = [...data].sort((a: any, b: any) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1
          if (a.role !== 'admin' && b.role === 'admin') return 1
          return (a.display_name ?? '').localeCompare(b.display_name ?? '')
        })
        setMembers(sorted)
      }
      setLoadingMembers(false)
    }
    load()
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)
    const { error } = await signIn(selected.email, password)
    setLoading(false)
    if (error) setError('Incorrect password. Please try again.')
    else navigate('/')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: 'linear-gradient(160deg, #FEF9E7 0%, #FFF3C4 40%, #FFF9E8 100%)',
      }}
    >
      {/* Background decorative circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative inline-block mb-4">
            <div
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #E8C158 0%, #D4A843 60%, #B45309 100%)' }}
            >
              <Heart size={32} className="text-white animate-float" fill="rgba(255,255,255,0.4)" />
            </div>
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30 mx-auto"
              style={{ background: '#D4A843', width: 80, height: 80 }} />
          </div>
          <h1 className="text-2xl font-black text-warm-900" style={{ fontFamily: 'var(--font-display)' }}>
            Dr Nikkie's Meds
          </h1>
          <p className="text-warm-500 mt-1 text-sm font-medium">Family Medicine Tracker</p>
        </div>

        {!selected ? (
          /* ── Member selector ── */
          <div className="animate-scale-in">
            <p className="text-center text-warm-500 text-xs font-bold mb-4 uppercase tracking-widest">
              Select your profile
            </p>

            {loadingMembers ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => { setSelected(member); setPassword(''); setError(null) }}
                    className="w-full flex items-center gap-4 rounded-2xl p-4 text-left group bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{
                      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Memoji avatar */}
                    <div className="relative flex-shrink-0">
                      <MemojiAvatar seed={member.display_name} size={56} rounded="2xl" avatarIndex={member.avatar_index ?? null} />
                      {/* Online indicator */}
                      <span className="online-dot" style={{ borderColor: 'white' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-warm-900">{member.display_name}</p>
                        {member.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid rgba(212,168,67,0.3)' }}>
                            <ShieldCheck size={9} /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-warm-500 mt-0.5">{member.relation ?? member.role}</p>
                    </div>

                    <ChevronRight size={16} className="text-warm-300 group-hover:text-brand-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-warm-400 mt-6">
              Private family health tracker · Authorised access only
            </p>
          </div>

        ) : (
          /* ── Password entry ── */
          <div className="animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl text-warm-400 hover:text-warm-700 hover:bg-black/5 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <MemojiAvatar seed={selected.display_name} size={44} rounded="xl" avatarIndex={selected.avatar_index ?? null} />
                <div>
                  <p className="font-bold text-warm-900 text-sm">{selected.display_name}</p>
                  <p className="text-xs text-warm-500">{selected.relation ?? selected.role}</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSignIn}
              className="bg-white rounded-3xl p-6 space-y-4"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <h2 className="font-semibold text-warm-700 text-sm">Enter your password</h2>

              {error && (
                <div className="text-sm rounded-xl px-4 py-3 font-medium"
                  style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', color: '#D00000' }}>
                  {error}
                </div>
              )}

              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoFocus
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12 text-lg tracking-widest"
                  placeholder="••••••"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading || !password} className="btn-primary w-full">
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                  : 'Sign In'
                }
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
