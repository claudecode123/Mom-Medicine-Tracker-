import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { DEMO_MODE } from '@/lib/demo'

export function LoginPage() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In demo mode, auto-redirect if already logged in
  useEffect(() => {
    if (session) navigate('/')
  }, [session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Incorrect email or password. Please try again.')
    } else {
      navigate('/')
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    await signIn('demo@example.com', 'demo')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-warm-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-warm-800">Mom's Medicine Tracker</h1>
          <p className="text-warm-500 mt-1.5">Sign in to continue</p>
        </div>

        {DEMO_MODE && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-amber-800 font-semibold text-sm">🎯 Demo Mode</p>
            <p className="text-amber-700 text-xs mt-1">Running locally with sample data. No Supabase needed.</p>
            <button onClick={handleDemoLogin} disabled={loading}
              className="btn-primary w-full mt-3 bg-amber-500 hover:bg-amber-600 text-sm py-2.5">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Loading…</> : 'Enter Demo →'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-warm-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-field pr-12" placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs text-warm-400 mt-5">
          Private family health tracker. Unauthorised access is not permitted.
        </p>
      </div>
    </div>
  )
}
