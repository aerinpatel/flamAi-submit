// Groq client. Groq speaks the OpenAI chat-completions protocol, so a plain fetch is enough (no SDK to install).
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
// Groq retires models often (llama-3.3-70b-versatile was shut down on 16 Aug 2026), so the model is an env setting.
// List what your key can use:  curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
export const modelName = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

// gpt-oss models "think" first, and thinking tokens count against max_tokens: keep it short and leave headroom.
const isReasoning = (m) => m.startsWith('openai/gpt-oss')

/** Maps anything thrown (or a non-2xx reply) to an LLMError: HTTP status + a stable code the client understands. */
export function toLLMError(err) {
  if (err instanceof LLMError) return err
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return new LLMError('TIMEOUT', 504, 'The AI took too long to respond.')
  if (err?.cause || /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(String(err?.message ?? '')))
    return new LLMError('UPSTREAM_ERROR', 502, 'Could not reach the AI service. Please try again.')
  console.error('[llm] unexpected error:', err)
  return new LLMError('INTERNAL_ERROR', 500, 'Unexpected error talking to the AI.')
}

/** Turns a non-2xx Groq reply into an LLMError. */
function fromHttp(status, body) {
  const detail = body?.error?.message ?? ''
  const code = body?.error?.code ?? ''
  if (status === 429) return new LLMError('RATE_LIMITED', 429, 'Rate limit reached. Please wait a moment.')
  if (status === 401 || status === 403) return new LLMError('CONFIG_ERROR', 500, "The server's Groq API key was rejected. Check GROQ_API_KEY.")
  if (status === 404 || /model_(not_found|decommissioned)/.test(code) || (status === 400 && /model/i.test(detail) && /(not found|does not exist|decommission)/i.test(detail))) {
    console.error(`[llm] model problem (${status}): ${detail}`)
    return new LLMError('CONFIG_ERROR', 500, `The Groq model "${modelName()}" is not available. Set GROQ_MODEL in .env to a current model (see console.groq.com/docs/models) and restart.`)
  }
  // Groq's JSON mode answers 400 json_validate_failed when the model produced invalid JSON.
  if (status === 400 && code === 'json_validate_failed') return new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  if (status >= 500) return new LLMError('UPSTREAM_ERROR', 502, 'Could not reach the AI service. Please try again.')
  console.error('[llm] unexpected Groq reply:', status, detail)
  return new LLMError('INTERNAL_ERROR', 500, 'Unexpected error talking to the AI.')
}

/**
 * Sends one prompt to Groq in JSON mode and returns the parsed JSON.
 * Checking its *shape* is the client's job (zod); here we only guarantee it is parsable.
 */
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
        response_format: { type: 'json_object' }, // JSON mode: the prompt must (and does) mention JSON
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
    console.error('[llm] output cut off at max_tokens')
    throw new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  }
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')) // tolerate a stray code fence
  } catch {
    console.error('[llm] malformed JSON:', raw.slice(0, 300))
    throw new LLMError('MALFORMED_JSON', 502, 'AI returned malformed JSON')
  }
}

export function sendError(res, err) {
  const e = toLLMError(err)
  res.status(e.status).json({ error: e.message, code: e.code })
}
