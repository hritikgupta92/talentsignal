import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ExternalLink, LinkIcon, Mail, MapPin, Radio, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { ExperienceTimeline } from '../features/recruiters/components/ExperienceTimeline'
import { followRecruiter, getRecruiterBySlug } from '../features/recruiters/services/recruiterService'
import { formatNumber } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import type { RecruiterProfile } from '../types/recruiter'

export function RecruiterProfilePage() {
  const { slug = '' } = useParams()
  const [profile, setProfile] = useState<RecruiterProfile | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const appUser = useAuthStore((state) => state.appUser)
  const domainsTitle = appUser?.role === 'jobseeker' ? 'Job Domains' : 'Hiring domains'

  useEffect(() => {
    getRecruiterBySlug(slug)
      .then(setProfile)
      .finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-slate-950">Recruiter not found</h1>
        <Link to="/discover" className="mt-6 inline-flex">
          <Button>Back to discovery</Button>
        </Link>
      </section>
    )
  }

  async function handleFollow() {
    if (!profile) return
    setIsFollowing(true)
    await followRecruiter(profile.id)
  }

  return (
    <div className="pb-14">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700">
            <ArrowLeft size={16} /> Back to discovery
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]"
          >
            <div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <img src={profile.avatarUrl} alt="" className="h-28 w-28 rounded-[1.75rem] object-cover ring-1 ring-slate-200" />
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">
                      <Radio size={13} /> Actively hiring
                    </Badge>
                    <Badge className="bg-slate-50 text-slate-600">Verified profile</Badge>
                  </div>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{profile.name}</h1>
                  <p className="mt-3 max-w-2xl text-xl leading-8 text-slate-600">{profile.headline}</p>
                </div>
              </div>
              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-700">{profile.bio}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness size={16} /> {profile.company}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} /> {profile.location}
                </span>
              </div>
            </div>

            <Card className="self-start p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-slate-950">{formatNumber(profile.followers)}</p>
                  <p className="text-xs font-semibold text-slate-500">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950">{profile.responseRate}%</p>
                  <p className="text-xs font-semibold text-slate-500">Response</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950">{profile.placements}</p>
                  <p className="text-xs font-semibold text-slate-500">Placements</p>
                </div>
              </div>
              <Button className="mt-5 w-full" variant={isFollowing ? 'success' : 'primary'} onClick={handleFollow}>
                {isFollowing ? <CheckCircle2 size={18} /> : <UsersRound size={18} />}
                {isFollowing ? 'Following' : 'Follow recruiter'}
              </Button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="secondary" size="icon" aria-label="LinkedIn">
                  <ExternalLink size={17} />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Website">
                  <LinkIcon size={17} />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Email">
                  <Mail size={17} />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-950">Experience</h2>
            </CardHeader>
            <CardContent>
              <ExperienceTimeline items={profile.experience} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-950">Active roles</h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              {profile.activeJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.company} · {job.location} · {job.seniority}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-950">{domainsTitle}</h2>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <Badge key={tag.id}>{tag.label}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-950">Recent activity</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.activities.map((activity) => (
                <div key={activity.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">{activity.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{activity.description}</p>
                  <p className="mt-2 text-xs font-semibold text-indigo-600">{activity.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
