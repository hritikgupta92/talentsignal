import { useEffect, useMemo, useState } from 'react'
import { listRecruiters } from '../services/recruiterService'
import type { RecruiterProfile } from '../../../types/recruiter'

export function useRecruiters() {
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    listRecruiters()
      .then((items) => {
        if (mounted) setRecruiters(items)
      })
      .catch(() => mounted && setError('Unable to load recruiters. Check the Supabase schema, RLS policies, and published recruiter seed data.'))
      .finally(() => mounted && setIsLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecruiters = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return recruiters.filter((recruiter) => {
      const matchesQuery =
        !normalized ||
        [recruiter.name, recruiter.headline, recruiter.company, recruiter.location]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      const matchesTag = selectedTag === 'All' || recruiter.tags.some((tag) => tag.label === selectedTag)
      return matchesQuery && matchesTag
    })
  }, [query, recruiters, selectedTag])

  return { recruiters, filteredRecruiters, query, setQuery, selectedTag, setSelectedTag, isLoading, error }
}
