import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import type { UserRole } from '../types/recruiter'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  fullName: string
}

interface AuthState {
  session: Session | null
  user: User | null
  appUser: AppUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (session: Session | null, appUser: AppUser | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  appUser: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (session, appUser) =>
    set({
      session,
      user: session?.user ?? null,
      appUser,
      isAuthenticated: Boolean(session?.user),
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      session: null,
      user: null,
      appUser: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
