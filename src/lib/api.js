import { z } from 'zod'
import { MIN_STEPS, MAX_STEPS } from '../../shared/constants.js'

function normalizeDifficulty(val) {
  const lower = String(val ?? '').toLowerCase().trim()
  if (['easy', 'beginner', 'simple'].includes(lower)) return 'Easy'
  if (['hard', 'difficult', 'advanced'].includes(lower)) return 'Hard'
  return 'Medium'
}
const DifficultySchema = z.string().transform(normalizeDifficulty).pipe(z.enum(['Easy', 'Medium', 'Hard']))

function firstGrapheme(s) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)[Symbol.iterator]().next()
    return first.done ? s : first.value.segment
  }
  return [...s][0] ?? s
}
const EmojiSchema = z.string().trim().min(1).transform(firstGrapheme)

const NullableText = z
  .string()
  .nullable()
  .default(null)
  .transform((v) => (v && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null))

const AmountSchema = z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1))
const text = z.string().trim().min(1)

const SuggestionSchema = z.object({
  name: text,
  description: text,
  cuisine: text,
  time: text,
  difficulty: DifficultySchema,
  emoji: EmojiSchema,
})
const SuggestResponseSchema = z.object({ suggestions: z.array(SuggestionSchema).min(1).max(6) })

const SwapOptionSchema = z.object({ name: text.max(60), note: text.max(240) })
const SwapsSchema = z.array(SwapOptionSchema).max(4).catch([])

const RecipeIngredientSchema = z.object({ name: text, amount: AmountSchema, swaps: SwapsSchema })

const RecipeStepSchema = z.object({
  title: text,
  instruction: text,
  duration: NullableText,
  tip: NullableText,
})

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
  return {
    success: false,
    error: `Unexpected ${label} data from AI (${issue?.path?.join('.') || 'unknown'}: ${issue?.message ?? 'Validation failed'}). Please retry.`,
    code: 'SCHEMA_MISMATCH',
  }
}
export const parseSuggest = (data) => parseWith(SuggestResponseSchema, data, 'dish')
export const parseRecipe = (data) => parseWith(RecipeResponseSchema, data, 'recipe')

export const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const RETRYABLE = new Set(['EMPTY_RESPONSE', 'MALFORMED_JSON', 'INTERNAL_ERROR', 'RATE_LIMITED', 'NETWORK_ERROR', 'TIMEOUT', 'UPSTREAM_ERROR'])
const buildError = (code, message) => ({ message, code, retryable: RETRYABLE.has(code) })

export async function callApi({ url, body, requestId, parse, timeoutMs, signal }) {
  const controller = new AbortController()
  let timedOut = false
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, requestId }),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
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
      return { ok: false, error: timedOut ? buildError('TIMEOUT', 'The request took too long. Please try again.') : buildError('ABORTED', 'Request cancelled.') }
    }
    return { ok: false, error: buildError('NETWORK_ERROR', 'Could not reach the server. Check your connection.') }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}