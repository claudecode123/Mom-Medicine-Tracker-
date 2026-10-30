import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { DEMO_MODE, DEMO_USER, DEMO_PROFILE } from '@/lib/demo'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateDemoProfile: (updates: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setProfile(data)
  }

  async function refreshProfile() {
    if (DEMO_MODE) return
    if (session?.user) await loadProfile(session.user.id)
  }

  function updateDemoProfile(updates: Partial<Profile>) {
    setProfile(prev => prev ? { ...prev, ...updates } : prev)
  }

  useEffect(() => {
    if (DEMO_MODE) {
      // Auto-login in demo mode — no Supabase needed
      setProfile(DEMO_PROFILE)
      setSession({ user: DEMO_USER } as any)
      setLoading(false)
      return
    }

    const autoEmail = import.meta.env.VITE_AUTO_EMAIL
    const autoPassword = import.meta.env.VITE_AUTO_PASSWORD

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        await loadProfile(session.user.id)
        setLoading(false)
      } else if (autoEmail && autoPassword) {
        // Silent auto-login — no login screen shown
        const { data, error } = await supabase.auth.signInWithPassword({ email: autoEmail, password: autoPassword })
        if (!error && data.session?.user) {
          setSession(data.session)
          await loadProfile(data.session.user.id)
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (DEMO_MODE) {
      setProfile(DEMO_PROFILE)
      setSession({ user: DEMO_USER } as any)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    if (DEMO_MODE) {
      setSession(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile, loading,
      demoMode: DEMO_MODE, signIn, signOut, refreshProfile, updateDemoProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
