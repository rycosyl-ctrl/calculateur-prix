import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  /** null tant que Supabase n'est pas configuré ou que personne n'est connecté */
  session: Session | null
  /** true pendant la restauration de session au chargement */
  loading: boolean
  /** false si les variables Supabase ne sont pas définies : mode local sans compte */
  enabled: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function frenchAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    'Email not confirmed': 'Email non confirmé : vérifiez votre boîte de réception.',
    'User already registered': 'Un compte existe déjà avec cet email.',
    'Password should be at least 6 characters.':
      'Le mot de passe doit contenir au moins 6 caractères.',
  }
  return map[message] ?? message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      enabled: supabase !== null,
      signIn: async (email, password) => {
        if (!supabase) return 'Supabase non configuré.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? frenchAuthError(error.message) : null
      },
      signUp: async (email, password) => {
        if (!supabase) return 'Supabase non configuré.'
        const { error } = await supabase.auth.signUp({ email, password })
        return error ? frenchAuthError(error.message) : null
      },
      signOut: async () => {
        await supabase?.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé sous AuthProvider')
  return ctx
}
