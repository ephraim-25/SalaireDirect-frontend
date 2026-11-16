'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TRIAL_DAYS = 7
const SESSION_COOKIE = 'sd-session'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Renvoie `needsEmailConfirmation: true` si Supabase exige la confirmation de l'e-mail avant connexion. */
  signUp: (email: string, password: string, companyName: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  trialDaysRemaining: number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function computeTrialDays(createdAt?: string | null): number | null {
  if (!createdAt) return null
  const end = new Date(createdAt)
  end.setDate(end.getDate() + TRIAL_DAYS)
  const remaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, remaining)
}

/**
 * Cookie « témoin » (sans aucune donnée sensible) lu par proxy.ts pour rediriger
 * les visiteurs non connectés. Le vrai jeton reste dans le stockage de Supabase ;
 * la sécurité réelle est assurée par le backend.
 */
function syncSessionCookie(active: boolean) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = active
    ? `${SESSION_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`
    : `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const apply = (next: Session | null) => {
      setSession(next)
      setUser(next?.user ?? null)
      setTrialDaysRemaining(next?.user ? computeTrialDays(next.user.created_at) : null)
      syncSessionCookie(Boolean(next))
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => apply(next))

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string, companyName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined,
      },
    })
    if (error) throw error
    return { needsEmailConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      trialDaysRemaining,
    }),
    [user, session, loading, signIn, signUp, signOut, requestPasswordReset, updatePassword, trialDaysRemaining]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
