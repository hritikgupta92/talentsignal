import { Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { RecruiterCard } from '../features/recruiters/components/RecruiterCard'
import { useRecruiters } from '../features/recruiters/hooks/useRecruiters'

export function DiscoveryPage() {
  const { recruiters, filteredRecruiters, query, setQuery, selectedTag, setSelectedTag, isLoading, error } = useRecruiters()
  const filters = [
    'All',
    ...Array.from(
      new Set(recruiters.flatMap((recruiter) => recruiter.tags.filter((tag) => tag.category === 'domain').map((tag) => tag.label))),
    ),
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge>
            <UsersRound size={13} /> Recruiter discovery
          </Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Find recruiters by signal, not noise.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Search across hiring domains, active roles, location, and credibility markers.
          </p>
        </div>
        <Card className="w-full p-3 lg:max-w-md">
          <div className="flex items-center gap-2">
            <Search className="ml-2 text-slate-400" size={20} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search AI, frontend, remote..."
              className="border-0 focus:ring-0"
            />
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <SlidersHorizontal size={16} /> Filters
        </span>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedTag(filter)}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
              selectedTag === filter
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {error ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">{error}</p> : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72" />)
          : filteredRecruiters.map((recruiter) => <RecruiterCard key={recruiter.id} recruiter={recruiter} />)}
      </div>

      {!isLoading && filteredRecruiters.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <h2 className="text-xl font-bold text-slate-950">No recruiters found</h2>
          <p className="mt-2 text-slate-600">Try a broader search or remove the selected domain filter.</p>
        </Card>
      ) : null}
    </section>
  )
}
