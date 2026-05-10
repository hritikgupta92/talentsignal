import type { Experience } from '../../../types/recruiter'

export function ExperienceTimeline({ items }: { items: Experience[] }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.id} className="relative pl-7">
          <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 shadow ring-4 ring-indigo-100" />
          <div className="absolute bottom-0 left-1.5 top-6 w-px bg-slate-200" />
          <p className="text-sm font-semibold text-indigo-700">
            {item.startDate} - {item.endDate}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            {item.role}, {item.company}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      ))}
    </div>
  )
}
