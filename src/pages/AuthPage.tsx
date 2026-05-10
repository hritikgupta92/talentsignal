import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, CheckCircle2, LockKeyhole, Mail, Search, UserRound } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { loginWithEmail, signupWithEmail, syncSelectedRole } from '../features/auth/authService'
import { isSupabaseConfigured } from '../services/supabase'
import type { UserRole } from '../types/recruiter'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('recruiter')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await loginWithEmail({ email, password, role })
        await syncSelectedRole(role, name)
      } else {
        const signupResult = await signupWithEmail({ email, password, name, role })
        if (isSupabaseConfigured && signupResult && !signupResult.session) {
          setNotice('Signup worked. Supabase requires email confirmation, so check your inbox and confirm your email before logging in.')
          return
        }
        await syncSelectedRole(role, name)
      }

      navigate(role === 'recruiter' ? '/dashboard' : '/discover')
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  function selectRole(nextRole: UserRole) {
    setRole(nextRole)
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Login / Signup</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose a role, then enter the product.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Supabase Auth powers login, signup, role metadata, and session persistence for the production MVP.
        </p>
        <div className="mt-8 grid max-w-xl gap-3 text-sm text-slate-600">
          {['Login supports recruiter and jobseeker sessions.', 'Signup captures role metadata for onboarding.', 'Sessions persist on refresh through Supabase Auth.'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className={`mt-5 inline-flex rounded-full px-3 py-2 text-sm font-bold ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {isSupabaseConfigured ? 'Supabase connected' : 'Supabase env not detected'}
        </div>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {(['login', 'signup'] as AuthMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                mode === item ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <div>
              <label className="text-sm font-semibold text-slate-700">Full name</label>
              <div className="relative mt-2">
                <UserRound className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
                <Input className="pl-10" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
              <Input
                className="pl-10"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative mt-2">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
              <Input
                className="pl-10"
                placeholder="Minimum 6 characters"
                type="password"
                value={password}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">I am joining as</label>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <RoleCard
                active={role === 'recruiter'}
                icon={<BriefcaseBusiness className="text-indigo-700" />}
                title="Recruiter"
                description="Manage profile, publish credibility, and track profile quality."
                onClick={() => selectRole('recruiter')}
              />
              <RoleCard
                active={role === 'jobseeker'}
                icon={<Search className="text-indigo-700" />}
                title="Jobseeker"
                description="Discover recruiters, filter by hiring domains, and follow trusted profiles."
                onClick={() => selectRole('jobseeker')}
              />
            </div>
          </div>

          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
          {notice ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{notice}</p> : null}

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Continuing...' : mode === 'login' ? 'Login' : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === 'login' ? 'New to TalentSignal?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-bold text-indigo-700 hover:text-indigo-900"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Create an account' : 'Login instead'}
          </button>
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">
          Your own email works when Supabase env vars are loaded. Visit <Link className="font-semibold text-slate-600" to="/discover">discovery</Link> anytime.
        </p>
      </Card>
    </section>
  )
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Authentication failed. Check your Supabase URL, anon key, and Auth settings.'
}

function RoleCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${
        active ? 'border-indigo-300 bg-indigo-50 shadow-sm shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
      }`}
    >
      {active ? <CheckCircle2 className="absolute right-4 top-4 text-emerald-600" size={18} /> : null}
      {icon}
      <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  )
}
