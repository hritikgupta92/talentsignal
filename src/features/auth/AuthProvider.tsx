import { useEffect, type ReactNode } from 'react'
import { getAppUser } from './authService'
import { supabase } from '../../services/supabase'
import { type AppUser, useAuthStore } from '../../store/authStore'
import type { UserRole } from '../../types/recruiter'

export function AuthProvider({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth)
  const setLoading = useAuthStore((state) => state.setLoading)
  const reset = useAuthStore((state) => state.reset)

  useEffect(() => {
    let mounted = true

    async function hydrate() {
      if (!supabase) {
        reset()
        return
      }

      setLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error || !data.session) {
        reset()
        return
      }

      const appUser = (await getAppUser(data.session.user.id)) ?? getFallbackAppUser(data.session.user)
      if (mounted) setAuth(data.session, appUser)
    }

    hydrate()

    if (!supabase) return undefined

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        reset()
        return
      }

      window.setTimeout(async () => {
        const appUser = (await getAppUser(session.user.id)) ?? getFallbackAppUser(session.user)
        if (mounted) setAuth(session, appUser)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [reset, setAuth, setLoading])

  return children
}

function getFallbackAppUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AppUser {
  const role = user.user_metadata?.role === 'recruiter' ? 'recruiter' : ('jobseeker' as UserRole)
  const email = user.email ?? ''
  return {
    id: user.id,
    email,
    role,
    fullName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : email.split('@')[0],
  }
}
