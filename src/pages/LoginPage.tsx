import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const AVATAR_GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-orange-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
]

interface FamilyMember {
  user_id: string
  display_name: string
  role: 'admin' | 'user'
  relation: string | null
  email: string
  initial: string
  gradient: string
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function MemberAvatar({ member, size = 'md' }: { member: FamilyMember; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-sm'
  const isAdmin = member.role === 'admin'
  return (
    <div className={cn('avatar-ring rounded-xl flex-shrink-0', size === 'lg' && 'rounded-2xl')}>
      <div
        className={cn(
          dim,
          'rounded-xl flex items-center justify-center font-black text-white relative z-10 select-none',
          size === 'lg' && 'rounded-2xl',
          `bg-gradient-to-br ${member.gradient}`
        )}
        style={{ boxShadow: isAdmin ? '0 4px 20px rgba(88,101,242,0.4)' : '0 4px 15px rgba(0,0,0,0.3)' }}
      >
        {member.initial}
      </div>
    </div>
  )
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

  useEffect(() => {
    if (session) navigate('/')
  }, [session])

  useEffect(() => {
    async function loadMembers() {
      setLoadingMembers(true)
      const { data } = await (supabase as any).rpc('get_family_members')
      if (data) {
        const sorted = [...data].sort((a: any, b: any) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1
          if (a.role !== 'admin' && b.role === 'admin') return 1
          return (a.display_name ?? '').localeCompare(b.display_name ?? '')
        })
        setMembers(sorted.map((m: any, i: number) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          role: m.role as 'admin' | 'user',
          relation: m.relation,
          email: m.email,
          initial: getInitials(m.display_name),
          gradient: m.role === 'admin'
            ? AVATAR_GRADIENTS[0]
            : AVATAR_GRADIENTS[1 + (i % (AVATAR_GRADIENTS.length - 1))],
        })))
      }
      setLoadingMembers(false)
    }
    loadMembers()
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)
    const { error } = await signIn(selected.email, password)
    setLoading(false)
    if (error) {
      setError('Incorrect password. Please try again.')
    } else {
      navigate('/')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at top, #1a1c3a 0%, #1e1f22 60%)' }}
    >
      <div className="w-full max-w-md">

        {/* ── App logo ── */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto shadow-2xl shadow-brand-900/60">
              <Heart size={28} className="text-white animate-float" fill="rgba(255,255,255,0.3)" />
            </div>
            {/* Blurple glow */}
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 bg-brand-500 -z-10" />
          </div>
          <h1 className="text-2xl font-black text-warm-800" style={{ fontFamily: 'Inter Tight, Inter, sans-serif' }}>
            Dr Nikkie's Meds
          </h1>
          <p className="text-warm-400 mt-1 text-sm font-medium">Family Medicine Tracker</p>
        </div>

        {!selected ? (
          /* ── Member selector ── */
          <div className="animate-scale-in">
            <p className="text-center text-warm-500 text-sm mb-5 font-semibold tracking-wide uppercase" style={{ letterSpacing: '0.08em' }}>
              Who are you?
            </p>

            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member, idx) => (
                  <button
                    key={member.user_id}
                    onClick={() => { setSelected(member); setPassword(''); setError(null) }}
                    className="w-full flex items-center gap-4 rounded-2xl p-4 text-left group transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(160deg, #36393f, #313338)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                      animationDelay: `${idx * 0.06}s`,
                    }}
                  >
                    <MemberAvatar member={member} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-warm-800">{member.display_name}</p>
                        {member.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full border border-brand-500/25">
                            <ShieldCheck size={9} />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-warm-400 mt-0.5">{member.relation ?? member.role}</p>
                    </div>

                    <ChevronRight size={16} className="text-warm-300 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-warm-400 mt-6">
              Private family health tracker · Unauthorised access is not permitted
            </p>
          </div>

        ) : (
          /* ── Password entry ── */
          <div className="animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl text-warm-400 hover:text-warm-700 hover:bg-white/5 transition-all duration-150"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <MemberAvatar member={selected} />
                <div>
                  <p className="font-bold text-warm-800 text-sm">{selected.display_name}</p>
                  <p className="text-xs text-warm-400">{selected.relation ?? selected.role}</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSignIn}
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: 'linear-gradient(160deg, #36393f, #313338)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              <h2 className="font-bold text-warm-700 text-sm tracking-wide">Enter your password</h2>

              {error && (
                <div className="text-red-400 text-sm rounded-xl px-4 py-3 font-medium"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
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
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1 transition-colors"
                >
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
