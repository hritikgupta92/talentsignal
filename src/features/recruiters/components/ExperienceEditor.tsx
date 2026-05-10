import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BriefcaseBusiness, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input, Textarea } from '../../../components/ui/input'
import type { Experience } from '../../../types/recruiter'

const emptyExperience: Omit<Experience, 'id'> = {
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
}

export function ExperienceEditor({
  items,
  onSave,
  onDelete,
}: {
  items: Experience[]
  onSave: (input: Omit<Experience, 'id'>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState<Experience | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const orderedItems = useMemo(() => newestFirst(items), [items])

  function openNew() {
    setEditing(null)
    setIsOpen(true)
  }

  function openEdit(item: Experience) {
    setEditing(item)
    setIsOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Experience timeline</h2>
          <p className="mt-1 text-sm text-slate-500">Newest roles appear first on your public profile.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={openNew}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {orderedItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-slate-950">Add your first experience</h3>
          <p className="mt-2 text-sm text-slate-500">Show candidates where you have built hiring judgment.</p>
          <Button className="mt-5" variant="secondary" onClick={openNew}>
            <Plus size={16} /> Add experience
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <AnimatePresence initial={false}>
            {orderedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {index < orderedItems.length - 1 ? (
                  <div className="absolute bottom-[-18px] left-8 top-14 w-px bg-slate-200" />
                ) : null}
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 ring-1 ring-indigo-100">
                    {item.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-indigo-700">
                          {item.startDate} - {item.isCurrent ? 'Present' : item.endDate}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-950">
                          {item.role}, {item.company}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="icon" onClick={() => openEdit(item)} aria-label="Edit experience">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label="Delete experience">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ExperienceModal
        isOpen={isOpen}
        experience={editing}
        onClose={() => setIsOpen(false)}
        onSave={async (input, id) => {
          await onSave(input, id)
          setIsOpen(false)
        }}
      />
    </div>
  )
}

function ExperienceModal({
  isOpen,
  experience,
  onClose,
  onSave,
}: {
  isOpen: boolean
  experience: Experience | null
  onClose: () => void
  onSave: (input: Omit<Experience, 'id'>, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Experience, 'id'>>(experience ?? emptyExperience)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setForm(experience ?? emptyExperience)
  }, [experience, isOpen])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!form.company.trim() || !form.role.trim() || !form.startDate.trim() || (!form.isCurrent && !form.endDate.trim())) {
      setError('Company, role, start date, and end date are required.')
      return
    }

    if (!form.isCurrent && form.startDate > form.endDate) {
      setError('Start date must be before end date.')
      return
    }

    setIsSaving(true)
    try {
      await onSave(
        {
          ...form,
          company: form.company.trim(),
          role: form.role.trim(),
          description: form.description.trim(),
          endDate: form.isCurrent ? 'Present' : form.endDate,
        },
        experience?.id,
      )
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save experience.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 p-4 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-950">{experience ? 'Edit experience' : 'Add experience'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <Input type="month" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </Field>
            <Field label="End date">
              <Input
                type="month"
                value={form.isCurrent ? '' : form.endDate}
                disabled={form.isCurrent}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.isCurrent)}
              onChange={(event) => setForm({ ...form, isCurrent: event.target.checked, endDate: event.target.checked ? 'Present' : '' })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            I currently work here
          </label>
          <Field label="Description">
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={isSaving}>{isSaving ? 'Saving...' : 'Save experience'}</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  )
}

function newestFirst(items: Experience[]) {
  return items.slice().sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1
    if (!a.isCurrent && b.isCurrent) return 1
    return b.startDate.localeCompare(a.startDate)
  })
}
