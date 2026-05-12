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

interface SupabaseAuthUser {
  id: string
}

const FEATURE_NAME = 'enhance-recruiter-bio'
const DAILY_LIMIT = 5

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

    const supabaseUrl = globalThis.Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = globalThis.Deno.env.get('SUPABASE_ANON_KEY')
    const authorization = request.headers.get('Authorization')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase Edge Function environment variables')
      return json({ error: 'Supabase function environment is not configured.' }, 500)
    }

    if (!authorization) {
      return json({ error: 'Login required to use AI improve.' }, 401)
    }

    const authUser = await getAuthenticatedUser(supabaseUrl, supabaseAnonKey, authorization)
    if (!authUser) {
      return json({ error: 'Invalid or expired session.' }, 401)
    }

    const usage = await getDailyUsage(supabaseUrl, supabaseAnonKey, authorization, authUser.id)
    if (usage >= DAILY_LIMIT) {
      return json(
        {
          error: `Daily AI improve limit reached. Try again tomorrow.`,
          limit: DAILY_LIMIT,
          used: usage,
        },
        429,
      )
    }

    await recordAiUsage(supabaseUrl, supabaseAnonKey, authorization, authUser.id)

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

async function getAuthenticatedUser(supabaseUrl: string, supabaseAnonKey: string, authorization: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  })

  if (!response.ok) {
    console.error('Supabase auth user lookup failed', response.status)
    return null
  }

  const user = (await response.json()) as Partial<SupabaseAuthUser>
  return typeof user.id === 'string' ? { id: user.id } : null
}

async function getDailyUsage(supabaseUrl: string, supabaseAnonKey: string, authorization: string, userId: string) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const url = new URL(`${supabaseUrl}/rest/v1/ai_usage_events`)
  url.searchParams.set('select', 'id')
  url.searchParams.set('user_id', `eq.${userId}`)
  url.searchParams.set('feature', `eq.${FEATURE_NAME}`)
  url.searchParams.set('created_at', `gte.${today.toISOString()}`)
  url.searchParams.set('limit', String(DAILY_LIMIT))

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('AI usage lookup failed', response.status, body)
    throw new Error('Unable to check AI usage limit.')
  }

  const rows = await response.json()
  return Array.isArray(rows) ? rows.length : 0
}

async function recordAiUsage(supabaseUrl: string, supabaseAnonKey: string, authorization: string, userId: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/ai_usage_events`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      feature: FEATURE_NAME,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('AI usage insert failed', response.status, body)
    throw new Error('Unable to record AI usage.')
  }
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
