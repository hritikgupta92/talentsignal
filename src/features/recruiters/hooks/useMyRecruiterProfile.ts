import { useCallback, useEffect, useState } from 'react'
import {
  addHiringTag,
  createExperience,
  deleteExperience,
  getMyRecruiterProfile,
  removeHiringTag,
  updateExperience,
  updateRecruiterProfile,
  uploadRecruiterAvatar,
} from '../services/recruiterService'
import { useAuthStore } from '../../../store/authStore'
import type { Experience, RecruiterProfile } from '../../../types/recruiter'

export function useMyRecruiterProfile() {
  const { appUser, user } = useAuthStore()
  const [profile, setProfile] = useState<RecruiterProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user || !appUser) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const nextProfile = await getMyRecruiterProfile(user.id, appUser.email, appUser.fullName)
      setProfile(nextProfile)
    } catch (profileError) {
      setError(getErrorMessage(profileError))
    } finally {
      setIsLoading(false)
    }
  }, [appUser, user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  async function saveProfile(values: Partial<RecruiterProfile>) {
    if (!profile) return
    const previous = profile
    setProfile({ ...profile, ...values })
    try {
      setProfile(await updateRecruiterProfile(profile.id, values))
    } catch (saveError) {
      setProfile(previous)
      throw saveError
    }
  }

  async function addTag(label: string) {
    if (!profile) return
    const tempTag = { id: `temp-${crypto.randomUUID()}`, label, category: 'domain' as const }
    setProfile({ ...profile, tags: [...profile.tags, tempTag] })
    try {
      const tag = await addHiringTag(profile.id, label)
      setProfile((current) =>
        current
          ? {
              ...current,
              tags: current.tags.map((item) => (item.id === tempTag.id ? tag : item)),
            }
          : current,
      )
    } catch (tagError) {
      setProfile(profile)
      throw tagError
    }
  }

  async function removeTag(tagId: string) {
    if (!profile) return
    const previous = profile
    setProfile({ ...profile, tags: profile.tags.filter((tag) => tag.id !== tagId) })
    try {
      await removeHiringTag(profile.id, tagId)
    } catch (tagError) {
      setProfile(previous)
      throw tagError
    }
  }

  async function uploadAvatar(file: File) {
    if (!profile) return
    const previous = profile
    const previewUrl = URL.createObjectURL(file)
    setProfile({ ...profile, avatarUrl: previewUrl })
    try {
      const publicUrl = await uploadRecruiterAvatar(profile.id, file, previous.avatarUrl)
      setProfile((current) => (current ? { ...current, avatarUrl: publicUrl } : current))
      URL.revokeObjectURL(previewUrl)
    } catch (uploadError) {
      URL.revokeObjectURL(previewUrl)
      setProfile(previous)
      throw uploadError
    }
  }

  async function saveExperience(input: Omit<Experience, 'id'>, id?: string) {
    if (!profile) return

    if (id) {
      const previous = profile
      setProfile({
        ...profile,
        experience: profile.experience.map((item) => (item.id === id ? { ...input, id } : item)),
      })
      try {
        const updated = await updateExperience(profile.id, id, input)
        setProfile((current) =>
          current
            ? { ...current, experience: newestFirst(current.experience.map((item) => (item.id === id ? updated : item))) }
            : current,
        )
      } catch (experienceError) {
        setProfile(previous)
        throw experienceError
      }
      return
    }

    const tempExperience = { ...input, id: `temp-${crypto.randomUUID()}` }
    setProfile({ ...profile, experience: newestFirst([tempExperience, ...profile.experience]) })
    try {
      const created = await createExperience(profile.id, input)
      setProfile((current) =>
        current
          ? {
              ...current,
              experience: newestFirst(current.experience.map((item) => (item.id === tempExperience.id ? created : item))),
            }
          : current,
      )
    } catch (experienceError) {
      setProfile(profile)
      throw experienceError
    }
  }

  async function removeExperience(id: string) {
    if (!profile) return
    const previous = profile
    setProfile({ ...profile, experience: profile.experience.filter((item) => item.id !== id) })
    try {
      await deleteExperience(profile.id, id)
    } catch (experienceError) {
      setProfile(previous)
      throw experienceError
    }
  }

  return {
    profile,
    isLoading,
    error,
    reload,
    saveProfile,
    addTag,
    removeTag,
    uploadAvatar,
    saveExperience,
    removeExperience,
  }
}

function newestFirst(items: Experience[]) {
  return items.slice().sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1
    if (!a.isCurrent && b.isCurrent) return 1
    return b.startDate.localeCompare(a.startDate)
  })
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load recruiter profile.'
}
