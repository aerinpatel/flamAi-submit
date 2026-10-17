import { z } from 'zod'
import { MIN_STEPS, MAX_STEPS } from '../../shared/constants.js'

// Client side of the API: response schemas (zod), parsing, and callApi (timeout, abort, one retry, request id check).

/** Maps "easy", "moderate", "advanced"... to Easy | Medium | Hard. Unknown values fall back to Medium. */
function normalizeDifficulty(val) {
  const lower = String(val ?? '').toLowerCase().trim()
  if (['easy', 'beginner', 'simple'].includes(lower)) return 'Easy'
  if (['hard', 'difficult', 'advanced'].includes(lower)) return 'Hard'
  return 'Medium'
}
const DifficultySchema = z.string().transform(normalizeDifficulty).pipe(z.enum(['Easy', 'Medium', 'Hard']))

/** Keeps the first emoji if the model sends several. */
function firstGrapheme(s) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)[Symbol.iterator]().next()
    return first.done ? s : first.value.segment
  }
  return [...s][0] ?? s
}
const EmojiSchema = z.string().trim().min(1).transform(firstGrapheme)

/** Text that may be null; "", "null" and a missing key all become null. */
const NullableText = z
  .string()
  .nullable()
  .default(null)
  .transform((v) => (v && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null))

/** Models sometimes send amounts as numbers (200) instead of "200 g". */
const AmountSchema = z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1))

const text = z.string().trim().min(1)

// ---- /api/suggest ----------------------------------------------------------------------------
const SuggestionSchema = z.object({
  name: text,
  description: text,
  cuisine: text,
  time: text,
  difficulty: DifficultySchema,
  emoji: EmojiSchema,
})
/** The hook keeps at most the number of dishes that still fit, so extra items are not an error. */
const SuggestResponseSchema = z.object({ suggestions: z.array(SuggestionSchema).min(1).max(6) })

// ---- swaps (inside every recipe ingredient) --------------------------------------------------
const SwapOptionSchema = z.object({ name: text.max(60), note: text.max(240) })
/** Swaps are a bonus: a broken swaps array becomes [] instead of failing the whole recipe. */
const SwapsSchema = z.array(SwapOptionSchema).max(4).catch([])

// ---- /api/recipe (also the answer of /api/swap) -------------------------------------------------------------------------------
const RecipeIngredientSchema = z.object({ name: text, amount: AmountSchema, swaps: SwapsSchema })

const RecipeStepSchema = z.object({
  title: text,
  instruction: text,
  duration: NullableText,
  tip: NullableText,
})

/** The model chooses the number of steps (MIN_STEPS to MAX_STEPS) to suit the recipe. */
const RecipeSchema = z.object({
  title: text,
  emoji: EmojiSchema,
  description: text,
  cuisine: text,
  prepTime: text,
  cookTime: text,
  servings: z.coerce.number().int().min(1).max(20),
  difficulty: DifficultySchema,
  ingredients: z.array(RecipeIngredientSchema).min(1).max(40),
  steps: z.array(RecipeStepSchema).min(MIN_STEPS).max(MAX_STEPS),
})
const RecipeResponseSchema = z.object({ recipe: RecipeSchema })

function parseWith(schema, data, label) {
  if (!data) return { success: false, error: 'No data received from server.', code: 'NULL_RESPONSE' }
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  const issue = result.error.issues[0]
  console.error(`[parse ${label}]`, result.error.issues)
  return {
    success: false,
    error: `Unexpected ${label} data from AI (${issue?.path?.join('.') || 'unknown'}: ${issue?.message ?? 'Validation failed'}). Please retry.`,
    code: 'SCHEMA_MISMATCH',
  }
}
export const parseSuggest = (data) => parseWith(SuggestResponseSchema, data, 'dish')
export const parseRecipe = (data) => parseWith(RecipeResponseSchema, data, 'recipe')

// A unique id for every API call (Math.random fallback: crypto.randomUUID needs https or localhost).
export const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

// Bad *output* is worth one more try (the model is not deterministic). Anything else fails fast.
const RETRY_CODES = new Set(['EMPTY_RESPONSE', 'MALFORMED_JSON', 'SCHEMA_MISMATCH', 'NULL_RESPONSE'])
const MIN_RETRY_MS = 5000
const RETRYABLE = new Set([
  'EMPTY_RESPONSE', 'MALFORMED_JSON', 'INTERNAL_ERROR',
  'RATE_LIMITED', 'NETWORK_ERROR', 'TIMEOUT', 'UPSTREAM_ERROR', 'SCHEMA_MISMATCH', 'NULL_RESPONSE',
])

const buildError = (code, message) => ({ message, code, retryable: RETRYABLE.has(code) })

// POSTs JSON to one of our /api endpoints and validates the answer with `parse`. Cancel with `signal`; the server echoes `requestId`,
// a mismatch is rejected (ID_MISMATCH); one automatic retry for bad output; `timeoutMs` covers all attempts.
export async function callApi({ url, body, requestId, parse, timeoutMs, signal }) {
  const started = Date.now()
  const controller = new AbortController()
  let timedOut = false
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)

  const once = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, requestId }),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        // No JSON body usually means the API server is down (the dev proxy answers with an empty 5xx).
        return {
          ok: false,
          error: data
            ? buildError(data.code ?? 'INTERNAL_ERROR', data.error ?? 'Request failed')
            : buildError('NETWORK_ERROR', 'Could not reach the server. Check your connection.'),
        }
      }
      if (data?.requestId !== requestId) {
        return { ok: false, error: buildError('ID_MISMATCH', 'The answer did not match this request. Start again from the home page.') }
      }
      const parsed = parse(data)
      return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: buildError(parsed.code, parsed.error) }
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { ok: false, error: timedOut
          ? buildError('TIMEOUT', 'The request took too long. Please try again.')
          : buildError('ABORTED', 'Request cancelled.') }
      }
      console.error('[callApi] network error:', err)
      return { ok: false, error: buildError('NETWORK_ERROR', 'Could not reach the server. Check your connection.') }
    }
  }

  try {
    let result = await once()
    if (!result.ok && RETRY_CODES.has(result.error.code) && !controller.signal.aborted && timeoutMs - (Date.now() - started) >= MIN_RETRY_MS) {
      result = await once()
    }
    return result
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
