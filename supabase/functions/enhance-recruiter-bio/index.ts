const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EnhanceBioRequest {
  bio?: string
  name?: string
  headline?: string
  company?: string
  domains?: string[]
}

if (!globalThis.Deno?.serve) {
  throw new Error('enhance-recruiter-bio must run as a Supabase Edge Function, not in the React browser app.')
}

globalThis.Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const openAiKey = globalThis.Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      console.error('Missing OPENAI_API_KEY secret')
      return json({ error: 'OPENAI_API_KEY is not configured in Supabase secrets.' }, 500)
    }

    const payload = (await request.json()) as EnhanceBioRequest
    const bio = payload.bio?.trim() ?? ''
    const domains = payload.domains?.filter(Boolean).join(', ') || 'recruiting'

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_output_tokens: 180,
        instructions:
          'You are helping a recruiter write a premium public profile bio. Keep it credible, specific, warm, and concise. Avoid buzzwords, exaggeration, emojis, and salesy language. Return only the improved bio text.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Name: ${payload.name || 'Recruiter'}`,
                  `Headline: ${payload.headline || 'Not provided'}`,
                  `Company: ${payload.company || 'Not provided'}`,
                  `Hiring domains: ${domains}`,
                  `Current bio: ${bio || 'No bio yet.'}`,
                  'Rewrite into 2-3 polished sentences, under 90 words.',
                ].join('\n'),
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI request failed', response.status, data?.error?.message)
      return json({ error: data?.error?.message ?? 'OpenAI request failed.' }, response.status)
    }

    const enhancedBio = extractOutputText(data)

    if (!enhancedBio) {
      console.error('OpenAI returned no text', JSON.stringify({ keys: Object.keys(data), status: data.status }))
      return json({ error: 'OpenAI returned no text. Check Edge Function logs for response shape.' }, 502)
    }

    return json({ bio: enhancedBio })
  } catch (error) {
    console.error('enhance-recruiter-bio failed', error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected Edge Function error.' }, 500)
  }
})

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const output = Array.isArray(data.output) ? data.output : []
  const text = output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => {
      if (!isRecord(content)) return ''
      if (typeof content.text === 'string') return content.text
      if (typeof content.output_text === 'string') return content.output_text
      return ''
    })
    .join('')
    .trim()

  return text || null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
