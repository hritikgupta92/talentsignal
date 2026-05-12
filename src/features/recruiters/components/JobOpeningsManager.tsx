import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BriefcaseBusiness, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import type { ActiveJob } from '../../../types/recruiter'

type JobDraft = Omit<ActiveJob, 'id'>

interface JobOpeningsManagerProps {
  jobs: ActiveJob[]
  onSave: (job: JobDraft, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onStatus?: (message: string, type: 'success' | 'error') => void
}

const emptyDraft: JobDraft = {
  title: '',
  company: '',
  location: '',
  seniority: '',
  isActive: true,
}

export function JobOpeningsManager({ jobs, onSave, onDelete, onStatus }: JobOpeningsManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [draft, setDraft] = useState<JobDraft>(emptyDraft)
  const [errors, setErrors] = useState<Partial<Record<keyof JobDraft, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const activeJobs = useMemo(() => jobs.filter((job) => job.isActive !== false), [jobs])

  function startCreate() {
    setDraft(emptyDraft)
    setEditingId(undefined)
    setErrors({})
    setIsEditing(true)
  }

  function startEdit(job: ActiveJob) {
    setDraft({
      title: job.title,
      company: job.company,
      location: job.location,
      seniority: job.seniority,
      isActive: job.isActive ?? true,
    })
    setEditingId(job.id)
    setErrors({})
    setIsEditing(true)
  }

  function closeForm() {
    setIsEditing(false)
    setEditingId(undefined)
    setDraft(emptyDraft)
    setErrors({})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextDraft = {
      ...draft,
      title: draft.title.trim(),
      company: draft.company.trim(),
      location: draft.location.trim(),
      seniority: draft.seniority.trim(),
    }
    const nextErrors: Partial<Record<keyof JobDraft, string>> = {}

    if (!nextDraft.title) nextErrors.title = 'Job title is required.'
    if (!nextDraft.company) nextErrors.company = 'Company is required.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    try {
      await onSave(nextDraft, editingId)
      onStatus?.(editingId ? 'Job opening updated.' : 'Job opening added.', 'success')
      closeForm()
    } catch (error) {
      onStatus?.(getErrorMessage(error), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id)
      onStatus?.('Job opening removed.', 'success')
    } catch (error) {
      onStatus?.(getErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Job openings</h2>
          <p className="mt-1 text-sm text-slate-500">Add active roles that should appear on your public recruiter profile.</p>
        </div>
        <Button variant="secondary" onClick={startCreate}>
          <Plus size={17} /> Add opening
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isEditing ? (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit}
            className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-slate-950">{editingId ? 'Edit opening' : 'New opening'}</p>
              <Button type="button" variant="ghost" size="icon" onClick={closeForm} aria-label="Close job form">
                <X size={17} />
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Job title" error={errors.title}>
                <Input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="Senior Frontend Engineer"
                />
              </Field>
              <Field label="Company" error={errors.company}>
                <Input value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} placeholder="Acme" />
              </Field>
              <Field label="Location">
                <Input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Remote" />
              </Field>
              <Field label="Seniority">
                <Input value={draft.seniority} onChange={(event) => setDraft({ ...draft, seniority: event.target.value })} placeholder="Senior" />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add opening'}
              </Button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <div className="mt-5 grid gap-3">
        <AnimatePresence initial={false}>
          {activeJobs.length > 0 ? (
            activeJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">Active</Badge>
                      {job.seniority ? <Badge className="bg-slate-50 text-slate-600">{job.seniority}</Badge> : null}
                    </div>
                    <h3 className="mt-3 font-bold text-slate-950">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={15} /> {job.company}
                      </span>
                      {job.location ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={15} /> {job.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <Button type="button" variant="secondary" size="icon" onClick={() => startEdit(job)} aria-label={`Edit ${job.title}`}>
                      <Pencil size={16} />
                    </Button>
                    <Button type="button" variant="secondary" size="icon" onClick={() => handleDelete(job.id)} aria-label={`Delete ${job.title}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
            >
              <BriefcaseBusiness className="mx-auto text-slate-400" size={26} />
              <p className="mt-3 font-bold text-slate-950">No active openings yet</p>
              <p className="mt-1 text-sm text-slate-500">Add one role to make the public profile feel actionable for candidates.</p>
              <Button className="mt-4" variant="secondary" onClick={startCreate}>
                <Plus size={17} /> Add first opening
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
