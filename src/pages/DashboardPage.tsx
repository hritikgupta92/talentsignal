import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bot, CheckCircle2, Eye, Radio, Sparkles, TrendingUp } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input, Textarea } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { AvatarUploader } from '../features/recruiters/components/AvatarUploader'
import { ExperienceEditor } from '../features/recruiters/components/ExperienceEditor'
import { HiringDomainTags } from '../features/recruiters/components/HiringDomainTags'
import { useMyRecruiterProfile } from '../features/recruiters/hooks/useMyRecruiterProfile'
import { useAiEnhancer } from '../hooks/useAiEnhancer'
import type { RecruiterProfile } from '../types/recruiter'

type Notice = { message: string; type: 'success' | 'error' } | null

export function DashboardPage() {
  const {
    profile,
    isLoading,
    error,
    saveProfile,
    addTag,
    removeTag,
    uploadAvatar,
    saveExperience,
    removeExperience,
  } = useMyRecruiterProfile()
  const [draft, setDraft] = useState<Partial<RecruiterProfile>>({})
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { enhanceBio, isGenerating } = useAiEnhancer()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profile) setDraft(profile)
  }, [profile])

  const completion = useMemo(() => {
    if (!profile) return 0
    const checks = [
      Boolean(draft.avatarUrl || profile.avatarUrl),
      Boolean(draft.headline || profile.headline),
      Boolean((draft.bio ?? profile.bio).length > 120),
      profile.tags.length >= 3,
      profile.experience.length >= 1,
      Boolean(draft.isPublished ?? profile.isPublished),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [draft.avatarUrl, draft.bio, draft.headline, draft.isPublished, profile])

  async function handleSaveProfile() {
    if (!profile) return
    setIsSaving(true)
    setNotice(null)
    try {
      await saveProfile({
        name: draft.name ?? profile.name,
        headline: draft.headline ?? profile.headline,
        company: draft.company ?? profile.company,
        location: draft.location ?? profile.location,
        bio: draft.bio ?? profile.bio,
      })
      setNotice({ message: 'Profile saved.', type: 'success' })
    } catch (saveError) {
      setNotice({ message: getErrorMessage(saveError), type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  async function togglePublish() {
    if (!profile) return
    try {
      await saveProfile({ isPublished: !profile.isPublished })
      setNotice({ message: !profile.isPublished ? 'Profile published.' : 'Profile unpublished.', type: 'success' })
    } catch (publishError) {
      setNotice({ message: getErrorMessage(publishError), type: 'error' })
    }
  }

  async function handleEnhance() {
    if (!profile) return
    try {
      const nextBio = await enhanceBio({
        bio: (draft.bio ?? profile.bio).toString(),
        name: (draft.name ?? profile.name).toString(),
        headline: (draft.headline ?? profile.headline).toString(),
        company: (draft.company ?? profile.company).toString(),
        domains: profile.tags.map((tag) => tag.label),
      })
      setDraft((current) => ({ ...current, bio: nextBio }))
      setNotice({ message: 'AI improved your bio. Review it, then save profile.', type: 'success' })
    } catch (aiError) {
      setNotice({ message: getErrorMessage(aiError), type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-52" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-[34rem]" />
        </div>
      </section>
    )
  }

  if (error || !profile) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-black text-slate-950">Unable to load your recruiter profile</h1>
          <p className="mt-3 text-slate-600">{error ?? 'Please refresh or check your Supabase setup.'}</p>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">
            <Radio size={13} /> Recruiter workspace
          </Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Profile command center</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Manage credibility, hiring focus, and publishing quality from one Supabase-backed dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/r/${profile.slug}`}>
            <Button variant="secondary">
              <Eye size={18} /> Preview
            </Button>
          </Link>
          <Button variant={profile.isPublished ? 'success' : 'primary'} onClick={togglePublish}>
            <CheckCircle2 size={18} /> {profile.isPublished ? 'Published' : 'Publish profile'}
          </Button>
        </div>
      </div>

      {notice ? (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${
            notice.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <Card className="p-5">
            <AvatarUploader
              name={draft.name ?? profile.name}
              avatarUrl={profile.avatarUrl}
              onUpload={uploadAvatar}
              onStatus={(message, type) => setNotice({ message, type })}
            />
            <div className="mt-5">
              <h2 className="text-lg font-bold text-slate-950">{draft.name ?? profile.name}</h2>
              <p className="text-sm text-slate-500">{draft.company || profile.company || 'Company not set'}</p>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Profile completion</span>
                <span className="text-indigo-700">{completion}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            {[
              { label: 'Profile views', value: 'Live soon', icon: TrendingUp },
              { label: 'Followers', value: profile.followers.toLocaleString(), icon: Sparkles },
              { label: 'Response rate', value: `${profile.responseRate}%`, icon: CheckCircle2 },
            ].map((metric) => (
              <Card key={metric.label} className="p-5">
                <metric.icon className="text-indigo-600" size={20} />
                <p className="mt-3 text-2xl font-black text-slate-950">{metric.value}</p>
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
              </Card>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Edit public profile</h2>
                <p className="mt-1 text-sm text-slate-500">Changes save to your Supabase recruiter profile.</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save profile'}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={draft.name ?? ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                </Field>
                <Field label="Company">
                  <Input value={draft.company ?? ''} onChange={(event) => setDraft({ ...draft, company: event.target.value })} />
                </Field>
              </div>
              <Field label="Location">
                <Input value={draft.location ?? ''} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
              </Field>
              <Field label="Headline">
                <Input value={draft.headline ?? ''} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} />
              </Field>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">Bio</label>
                  <Button variant="secondary" size="sm" onClick={handleEnhance} disabled={isGenerating}>
                    <Bot size={16} /> {isGenerating ? 'Enhancing...' : 'AI improve'}
                  </Button>
                </div>
                <Textarea className="mt-2" value={draft.bio ?? ''} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Hiring domains</label>
                <div className="mt-2">
                  <HiringDomainTags tags={profile.tags} onAdd={addTag} onRemove={removeTag} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <ExperienceEditor
                items={profile.experience}
                onSave={saveExperience}
                onDelete={async (id) => {
                  try {
                    await removeExperience(id)
                    setNotice({ message: 'Experience removed.', type: 'success' })
                  } catch (deleteError) {
                    setNotice({ message: getErrorMessage(deleteError), type: 'error' })
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
