import { useState } from 'react'
import { supabase } from '../services/supabase'

interface EnhanceBioInput {
  bio: string
  name?: string
  headline?: string
  company?: string
  domains?: string[]
}

export function useAiEnhancer() {
  const [isGenerating, setIsGenerating] = useState(false)

  async function enhanceBio(input: EnhanceBioInput) {
    setIsGenerating(true)
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.')
      }

      const { data, error } = await supabase.functions.invoke<{ bio: string }>('enhance-recruiter-bio', {
        body: input,
      })

      if (error) throw await getFunctionError(error)
      if (!data?.bio) throw new Error('AI response was empty.')

      return data.bio
    } finally {
      setIsGenerating(false)
    }
  }

  return { enhanceBio, isGenerating }
}

async function getFunctionError(error: unknown) {
  if (isFunctionHttpError(error)) {
    try {
      const body = (await error.context.json()) as { error?: string }
      if (body.error) return new Error(body.error)
    } catch {
      return error
    }
  }

  return error
}

function isFunctionHttpError(error: unknown): error is Error & { context: Response } {
  return error instanceof Error && 'context' in error && error.context instanceof Response
}
