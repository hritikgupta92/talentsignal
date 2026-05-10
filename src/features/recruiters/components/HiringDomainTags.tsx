import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { HiringTag } from '../../../types/recruiter'

const MAX_TAGS = 8

export function HiringDomainTags({
  tags,
  onAdd,
  onRemove,
}: {
  tags: HiringTag[]
  onAdd: (label: string) => Promise<void>
  onRemove: (tagId: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitTag() {
    const label = value.trim().replace(/\s+/g, ' ')
    setError(null)

    if (!label) return
    if (tags.length >= MAX_TAGS) {
      setError('You can add up to 8 hiring domains.')
      return
    }
    if (tags.some((tag) => tag.label.toLowerCase() === label.toLowerCase())) {
      setError('That domain is already listed.')
      return
    }

    setIsAdding(true)
    try {
      await onAdd(label)
      setValue('')
    } catch (tagError) {
      setError(tagError instanceof Error ? tagError.message : 'Unable to add tag.')
    } finally {
      setIsAdding(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      submitTag()
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onRemove(tag.id)}
            className="group inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            title={`Remove ${tag.label}`}
          >
            {tag.label}
            <X size={13} className="opacity-45 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={tags.length >= MAX_TAGS || isAdding}
          placeholder={tags.length >= MAX_TAGS ? 'Maximum reached' : 'Add domain, e.g. AI Infrastructure'}
          className="h-10 min-w-0 flex-1 rounded-full border border-dashed border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={submitTag}
          disabled={isAdding || tags.length >= MAX_TAGS}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-dashed border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus size={15} /> {isAdding ? 'Adding' : 'Add tag'}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm font-medium text-rose-600">{error}</p> : null}
      <p className="mt-2 text-xs font-medium text-slate-400">{tags.length}/{MAX_TAGS} domains</p>
    </div>
  )
}
