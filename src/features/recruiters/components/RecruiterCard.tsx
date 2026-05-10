import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Radio, UsersRound } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { formatNumber } from '../../../lib/utils'
import type { RecruiterProfile } from '../../../types/recruiter'

export function RecruiterCard({ recruiter }: { recruiter: RecruiterProfile }) {
  return (
    <Card className="group overflow-hidden transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <img
            src={recruiter.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="truncate text-lg font-bold text-slate-950">{recruiter.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{recruiter.headline}</p>
              </div>
              <ArrowUpRight className="mt-1 text-slate-300 transition group-hover:text-indigo-500" size={20} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} /> {recruiter.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersRound size={15} /> {formatNumber(recruiter.followers)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {recruiter.tags.slice(0, 4).map((tag) => (
            <Badge key={tag.id}>{tag.label}</Badge>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Radio size={16} /> {recruiter.activeJobs.length} active roles
          </span>
          <Link to={`/r/${recruiter.slug}`}>
            <Button variant="secondary" size="sm">
              View profile
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
