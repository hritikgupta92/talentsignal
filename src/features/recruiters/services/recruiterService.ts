import { supabase } from '../../../services/supabase'
import type { Experience, HiringStatus, HiringTag, RecruiterProfile } from '../../../types/recruiter'

const recruiterSelect = `
  *,
  experiences(*),
  recruiter_hiring_tags(hiring_tags(*)),
  active_jobs(*),
  profile_activities(*)
`

export async function listRecruiters(): Promise<RecruiterProfile[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('recruiter_profiles')
    .select(recruiterSelect)
    .eq('is_published', true)

  if (error) throw error
  return (data ?? []).map(mapRecruiterProfile)
}

export async function getRecruiterBySlug(slug: string): Promise<RecruiterProfile | undefined> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('recruiter_profiles')
    .select(recruiterSelect)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return mapRecruiterProfile(data)
}

export async function followRecruiter(recruiterId: string) {
  if (supabase) {
    return { ok: true, recruiterId }
  }

  throw new Error('Supabase is not configured.')
}

type SupabaseRecruiterRow = {
  id: string
  user_id: string | null
  slug: string
  name: string
  headline: string
  company: string | null
  location: string | null
  avatar_url: string | null
  bio: string | null
  hiring_status: HiringStatus
  followers_count: number
  response_rate: number
  placements_count: number
  is_published: boolean
  linkedin_url: string | null
  website_url: string | null
  contact_email: string | null
  experiences?: Array<{
    id: string
    company: string
    role: string
    start_date: string
    end_date: string
    description: string | null
    is_current?: boolean | null
    sort_order: number
  }>
  recruiter_hiring_tags?: Array<{
    hiring_tags: {
      id: string
      label: string
      category: 'domain' | 'seniority' | 'location' | 'employment'
    } | null
  }>
  active_jobs?: Array<{
    id: string
    title: string
    company: string
    location: string | null
    seniority: string | null
    sort_order: number
  }>
  profile_activities?: Array<{
    id: string
    title: string
    description: string | null
    activity_date: string
    sort_order: number
  }>
}

function mapRecruiterProfile(row: SupabaseRecruiterRow): RecruiterProfile {
  return {
    id: row.id,
    userId: row.user_id ?? '',
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    company: row.company ?? '',
    location: row.location ?? '',
    avatarUrl: row.avatar_url ?? '',
    bio: row.bio ?? '',
    hiringStatus: row.hiring_status,
    followers: row.followers_count,
    responseRate: row.response_rate,
    placements: row.placements_count,
    isPublished: row.is_published,
    links: {
      linkedin: row.linkedin_url ?? undefined,
      website: row.website_url ?? undefined,
      email: row.contact_email ?? undefined,
    },
    tags:
      row.recruiter_hiring_tags
        ?.map((link) => link.hiring_tags)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)) ?? [],
    experience:
      row.experiences
        ?.slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((experience) => ({
          id: experience.id,
          company: experience.company,
          role: experience.role,
          startDate: experience.start_date,
          endDate: experience.end_date,
          isCurrent: Boolean(experience.is_current),
          description: experience.description ?? '',
        })) ?? [],
    activeJobs:
      row.active_jobs
        ?.slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location ?? '',
          seniority: job.seniority ?? '',
        })) ?? [],
    activities:
      row.profile_activities
        ?.slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((activity) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description ?? '',
          date: activity.activity_date,
        })) ?? [],
  }
}

export async function getMyRecruiterProfile(userId: string, fallbackEmail: string, fallbackName: string): Promise<RecruiterProfile> {
  if (!supabase) throw new Error('Supabase is not configured.')

  await ensurePublicUser(userId, fallbackEmail, fallbackName)

  const { data, error } = await supabase
    .from('recruiter_profiles')
    .select(recruiterSelect)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return mapRecruiterProfile(data)

  const slug = `${slugify(fallbackName || fallbackEmail.split('@')[0])}-${userId.slice(0, 6)}`
  const { data: created, error: createError } = await supabase
    .from('recruiter_profiles')
    .insert({
      user_id: userId,
      slug,
      name: fallbackName || fallbackEmail.split('@')[0],
      headline: 'Recruiter building a trusted hiring profile',
      company: '',
      location: '',
      avatar_url: null,
      bio: '',
      hiring_status: 'networking',
      is_published: false,
      contact_email: fallbackEmail,
    })
    .select(recruiterSelect)
    .single()

  if (createError) throw createError
  return mapRecruiterProfile(created)
}

export async function updateRecruiterProfile(profileId: string, values: Partial<RecruiterProfile>) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const payload = removeUndefined({
    name: values.name,
    headline: values.headline,
    company: values.company,
    location: values.location,
    bio: values.bio,
    avatar_url: values.avatarUrl,
    is_published: values.isPublished,
    updated_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('recruiter_profiles')
    .update(payload)
    .eq('id', profileId)
    .select(recruiterSelect)
    .single()

  if (error) throw error
  return mapRecruiterProfile(data)
}

export async function addHiringTag(profileId: string, label: string): Promise<HiringTag> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const normalizedLabel = label.trim().replace(/\s+/g, ' ')
  const { data, error } = await supabase.rpc('add_recruiter_hiring_tag', {
    selected_profile_id: profileId,
    selected_label: normalizedLabel,
  })

  if (error) throw error
  return data as HiringTag
}

export async function removeHiringTag(profileId: string, tagId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error } = await supabase.rpc('remove_recruiter_hiring_tag', {
    selected_profile_id: profileId,
    selected_tag_id: tagId,
  })

  if (error) throw error
}

export async function uploadRecruiterAvatar(profileId: string, file: File, oldAvatarUrl?: string) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `recruiters/${profileId}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  await updateRecruiterProfile(profileId, { avatarUrl: data.publicUrl })

  const oldPath = getAvatarPath(oldAvatarUrl)
  if (oldPath && oldPath !== path) {
    await supabase.storage.from('avatars').remove([oldPath])
  }

  return data.publicUrl
}

export async function createExperience(profileId: string, input: Omit<Experience, 'id'>) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('experiences')
    .insert({
      recruiter_profile_id: profileId,
      company: input.company,
      role: input.role,
      start_date: input.startDate,
      end_date: input.isCurrent ? 'Present' : input.endDate,
      is_current: Boolean(input.isCurrent),
      description: input.description,
      sort_order: Math.floor(Date.now() / 1000),
    })
    .select('*')
    .single()

  if (error) throw error
  return mapExperience(data)
}

export async function updateExperience(profileId: string, experienceId: string, input: Omit<Experience, 'id'>) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('experiences')
    .update({
      company: input.company,
      role: input.role,
      start_date: input.startDate,
      end_date: input.isCurrent ? 'Present' : input.endDate,
      is_current: Boolean(input.isCurrent),
      description: input.description,
    })
    .eq('id', experienceId)
    .eq('recruiter_profile_id', profileId)
    .select('*')
    .single()

  if (error) throw error
  return mapExperience(data)
}

export async function deleteExperience(profileId: string, experienceId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('id', experienceId)
    .eq('recruiter_profile_id', profileId)

  if (error) throw error
}

function mapExperience(row: {
  id: string
  company: string
  role: string
  start_date: string
  end_date: string
  is_current?: boolean | null
  description?: string | null
}): Experience {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: Boolean(row.is_current),
    description: row.description ?? '',
  }
}

async function ensurePublicUser(userId: string, email: string, fullName: string) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error } = await supabase.rpc('ensure_current_user', {
    selected_role: 'recruiter',
    selected_full_name: fullName || email.split('@')[0],
  })
  if (error) {
    throw new Error(
      `${error.message}. Run the ensure_current_user SQL function in Supabase SQL Editor, then execute notify pgrst, 'reload schema';`,
    )
  }

  if (!userId || !email) {
    throw new Error('Authenticated user context is missing.')
  }
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getAvatarPath(url?: string) {
  if (!url || !url.includes('/storage/v1/object/public/avatars/')) return null
  return decodeURIComponent(url.split('/storage/v1/object/public/avatars/')[1] ?? '')
}
