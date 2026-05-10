import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { initials } from '../../../lib/utils'

const MAX_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function AvatarUploader({
  name,
  avatarUrl,
  onUpload,
  onStatus,
}: {
  name: string
  avatarUrl?: string
  onUpload: (file: File) => Promise<void>
  onStatus: (message: string, type: 'success' | 'error') => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onStatus('Use a JPG, PNG, or WebP image.', 'error')
      return
    }

    if (file.size > MAX_SIZE) {
      onStatus('Avatar must be 2MB or smaller.', 'error')
      return
    }

    setIsUploading(true)
    try {
      await onUpload(file)
      onStatus('Avatar updated.', 'success')
    } catch (uploadError) {
      onStatus(uploadError instanceof Error ? uploadError.message : 'Unable to upload avatar.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-20 w-20 overflow-hidden rounded-2xl bg-indigo-50 ring-1 ring-slate-200 transition hover:ring-indigo-200"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-black text-indigo-700">{initials(name || 'Recruiter')}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
          {isUploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload photo'}
        </span>
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
          {isUploading ? 'Uploading...' : 'Upload avatar'}
        </button>
        <p className="mt-2 text-xs font-medium text-slate-400">JPG, PNG, or WebP. Max 2MB.</p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </div>
  )
}
