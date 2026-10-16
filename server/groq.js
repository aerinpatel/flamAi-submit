export class LLMError extends Error {
  constructor(code, status, message) {
    super(message)
    this.code = code
    this.status = status
  }
}

const SYSTEM =
  'You are a JSON API. You only output valid JSON. You never output markdown, explanations, or code fences. ' +
  'Your entire response is always a single valid JSON object starting with { and ending with }.'

const endpoint = () => `${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`
export const modelName = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

const isReasoning = (m) => m.startsWith('openai/gpt-oss')

export function toLLMError(err) {
  if (err instanceof LLMError) return err
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return new LLMError('TIMEOUT', 504, 'The AI took too long to respond.')
  if (err?.cause || /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(String(err?.message ?? '')))
    return new LLMError('UPSTREAM_ERROR', 502, 'Could not reach the AI service. Please try again.')
  return new LLMError('INTERNAL_ERROR', 500, 'Unexpected error talking to the AI.')
}

function fromHttp(status, body) {
  const detail = body?.error?.message ?? ''
  const code = body?.error?.code ?? ''
  if (status === 429) return new LLMError('RATE_LIMITED', 429, 'Rate limit reached. Please wait a moment.')
  if (status === 401 || status === 403) return new LLMError('CONFIG_ERROR', 500, "The server's Groq API key was rejected. Check GROQ_API_KEY.")
  if (status === 404 || /model_(not_found|decommissioned)/.test(code) || (status === 400 && /model/i.test(detail) && /(not found|does not exist|decommission)/i.test(detail))) {
    return new LLMError('CONFIG_ERROR', 500, `The Groq model "${modelName()}" is not available. Set GROQ_MODEL in .env to a current model and restart.`)
  }
  if (status === 400 && code === 'json_validate_failed') return new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  if (status >= 500) return new LLMError('UPSTREAM_ERROR', 502, 'Could not reach the AI service. Please try again.')
  return new LLMError('INTERNAL_ERROR', 500, 'Unexpected error talking to the AI.')
}

export async function generateJSON({ prompt, maxTokens, timeoutMs }) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new LLMError('CONFIG_ERROR', 500, 'The server is missing its GROQ_API_KEY.')

  let response, body
  try {
    response = await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.5,
        max_tokens: isReasoning(modelName()) ? maxTokens + 1500 : maxTokens,
        ...(isReasoning(modelName()) && { reasoning_effort: 'low' }),
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    body = await response.json().catch(() => null)
  } catch (err) {
    throw toLLMError(err)
  }

  if (!response.ok) throw fromHttp(response.status, body)

  const choice = body?.choices?.[0]
  const raw = String(choice?.message?.content ?? '').trim()
  if (!raw) throw new LLMError('EMPTY_RESPONSE', 502, 'Empty response from AI model')
  if (choice.finish_reason === 'length') {
    throw new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  }
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    throw new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  }
}

export function sendError(res, err) {
  const e = toLLMError(err)
  res.status(e.status).json({ error: e.message, code: e.code })
}