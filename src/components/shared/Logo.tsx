import { Sparkles } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-slate-950">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
        <Sparkles size={18} />
      </div>
      <span className="text-base font-bold tracking-tight">TalentSignal</span>
    </div>
  )
}
