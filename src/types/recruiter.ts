export type UserRole = 'recruiter' | 'jobseeker'

export type HiringStatus = 'actively-hiring' | 'selectively-hiring' | 'networking'

export interface HiringTag {
  id: string
  label: string
  category: 'domain' | 'seniority' | 'location' | 'employment'
}

export interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  isCurrent?: boolean
  description: string
}

export interface ActiveJob {
  id: string
  title: string
  company: string
  location: string
  seniority: string
}

export interface Activity {
  id: string
  title: string
  description: string
  date: string
}

export interface RecruiterProfile {
  id: string
  userId: string
  slug: string
  name: string
  headline: string
  company: string
  location: string
  avatarUrl: string
  bio: string
  hiringStatus: HiringStatus
  tags: HiringTag[]
  experience: Experience[]
  activeJobs: ActiveJob[]
  activities: Activity[]
  followers: number
  responseRate: number
  placements: number
  isPublished: boolean
  links: {
    linkedin?: string
    website?: string
    email?: string
  }
}

export interface ProfileDraft {
  name: string
  headline: string
  bio: string
  company: string
  location: string
  hiringStatus: HiringStatus
}
