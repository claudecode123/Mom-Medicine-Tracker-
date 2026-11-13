import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const MEMBER_COLORS = ['bg-brand-500', 'bg-violet-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500']

interface FamilyMember {
  user_id: string
  display_name: string
  role: 'admin' | 'user'
  relation: string | null
  email: string
  initial: string
  color: string
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
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
          color: m.role === 'admin' ? 'bg-brand-500' : MEMBER_COLORS[1 + (i % (MEMBER_COLORS.length - 1))],
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

  function handleSelectMember(member: FamilyMember) {
    setSelected(member)
    setPassword('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <Heart size={28} className="text-white fill-white/30" />
          </div>
          <h1 className="text-2xl font-bold text-warm-800 font-display">Dr Nikkie's Meds</h1>
          <p className="text-warm-400 mt-1 text-sm">Family Medicine Tracker</p>
        </div>

        {!selected ? (
          <div>
            <p className="text-center text-warm-500 text-sm mb-5 font-medium">Who are you?</p>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <button
                    key={member.user_id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full flex items-center gap-4 bg-white rounded-2xl border border-warm-100 p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all text-left group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${member.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {member.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-warm-800">{member.display_name}</p>
                        {member.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={11} />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-warm-400">{member.relation ?? member.role}</p>
                    </div>
                    <ChevronLeft size={16} className="text-warm-300 rotate-180 group-hover:text-brand-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-center text-xs text-warm-300 mt-6">
              Private family health tracker · Unauthorised access is not permitted
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl hover:bg-warm-100 text-warm-400 hover:text-warm-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${selected.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {selected.initial}
                </div>
                <div>
                  <p className="font-semibold text-warm-800 text-sm">{selected.display_name}</p>
                  <p className="text-xs text-warm-400">{selected.relation ?? selected.role}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="bg-white rounded-2xl shadow-sm border border-warm-100 p-6 space-y-4">
              <h2 className="font-semibold text-warm-700 text-sm">Enter your password</h2>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
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
                  className="input-field pr-12 text-lg tracking-wider"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1"
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
