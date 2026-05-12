import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { RecruiterCard } from '../features/recruiters/components/RecruiterCard'
import { useRecruiters } from '../features/recruiters/hooks/useRecruiters'

const features = [
  { icon: ShieldCheck, title: 'Credibility-first profiles', copy: 'Recruiters showcase hiring focus, proof points, experience, and transparent activity.' },
  { icon: UsersRound, title: 'Candidate discovery', copy: 'Jobseekers can search, filter, follow, and revisit recruiters who match their career goals.' },
  { icon: BarChart3, title: 'Recruiter workspace', copy: 'A compact dashboard helps recruiters manage profile quality, tags, publishing, and engagement.' },
]

export function LandingPage() {
  const { recruiters, isLoading } = useRecruiters()
  const primaryRecruiter = recruiters[0]

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 grid-paper opacity-70" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">
              <Sparkles size={13} /> MVP for trusted recruiter discovery
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Follow recruiters before the right role opens.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              TalentSignal gives recruiters a credible public profile and gives candidates a focused way to discover hiring domains, active searches, and recruiting style.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/discover">
                <Button size="lg">
                  Explore recruiters <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="secondary">
                  Create profile
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm">
              {['3.4k follows', '92% response rate', '48 active searches'].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white/80 p-3 font-semibold text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="glass-panel rounded-[2rem] p-3"
          >
            {isLoading ? <Skeleton className="h-72" /> : primaryRecruiter ? <RecruiterCard recruiter={primaryRecruiter} /> : null}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {recruiters.slice(1).map((recruiter) => (
                <Card key={recruiter.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={recruiter.avatarUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{recruiter.name}</p>
                      <p className="truncate text-xs text-slate-500">{recruiter.company}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6">
              <feature.icon className="text-indigo-600" size={24} />
              <h2 className="mt-5 text-xl font-bold text-slate-950">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{feature.copy}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-200">Built for fast, credible signal</p>
              <h2 className="mt-2 text-2xl font-bold">Focused, credible, and Netlify deployable.</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              {['Free auth', 'RLS policies', 'Storage avatars', 'AI bio assist'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <CheckCircle2 size={15} /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
