'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, companyName: string) => Promise<void>
  signOut: () => Promise<void>
  trialDaysRemaining: number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        calculateTrialDays(session.user.created_at)
        // Store access token in cookie for middleware
        if (typeof window !== 'undefined') {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        calculateTrialDays(session.user.created_at)
        // Store access token in cookie for middleware
        if (typeof window !== 'undefined') {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`
        }
      } else {
        setTrialDaysRemaining(null)
        // Clear cookie on logout
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax'
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const calculateTrialDays = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const trialEndDate = new Date(createdDate)
    trialEndDate.setDate(trialEndDate.getDate() + 7)
    
    const today = new Date()
    const daysRemaining = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setTrialDaysRemaining(Math.max(0, daysRemaining))
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, companyName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        trialDaysRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
