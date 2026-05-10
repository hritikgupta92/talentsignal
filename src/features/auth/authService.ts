import { isSupabaseConfigured, supabase } from '../../services/supabase'
import type { AppUser } from '../../store/authStore'
import type { UserRole } from '../../types/recruiter'

interface AuthPayload {
  email: string
  password: string
  name?: string
  role: UserRole
}

export async function loginWithEmail({ email, password }: AuthPayload) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return
  }

  throw new Error('Supabase environment variables are missing.')
}

export async function signupWithEmail({ email, password, name, role }: AuthPayload) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name?.trim(),
          role,
        },
      },
    })
    if (error) throw error
    return data
  }

  throw new Error('Supabase environment variables are missing.')
}

export async function syncSelectedRole(role: UserRole, name?: string) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      role,
      ...(name?.trim() ? { full_name: name.trim() } : {}),
    },
  })

  if (metadataError) throw metadataError

  const { error: rpcError } = await supabase.rpc('ensure_current_user', {
    selected_role: role,
    selected_full_name: name?.trim() || null,
  })

  if (rpcError) throw rpcError
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

export async function getAppUser(userId: string): Promise<AppUser | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    fullName: data.full_name ?? data.email.split('@')[0],
  }
}
