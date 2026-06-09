import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isManager: boolean
  isOwner: boolean
  signInDiscord: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    // Synchronise pseudo/avatar Discord -> profil, puis récupère le profil.
    try {
      await supabase.rpc('sync_profile')
    } catch {
      /* ignore : le profil sera complété au prochain chargement */
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id)
  }, [session, loadProfile])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user?.id) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return
      setSession(newSession)
      if (newSession?.user?.id) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInDiscord = useCallback(async () => {
    // Retour sur l'URL courante (compatible base relative + HashRouter)
    const redirectTo = window.location.origin + window.location.pathname
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo, scopes: 'identify email' },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value: AuthState = {
    session,
    profile,
    loading,
    isManager: profile?.role === 'manager' || profile?.role === 'owner',
    isOwner: profile?.role === 'owner',
    signInDiscord,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
