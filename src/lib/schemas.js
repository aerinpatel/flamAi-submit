import { z } from 'zod'
import { MIN_STEPS, MAX_STEPS } from '../constants'

// Zod schemas for every AI response, plus the parse functions that validate them before they reach React state.

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
const SuggestResponseSchema = z.object({ suggestions: z.array(SuggestionSchema).min(1) })

// ---- swaps (inside every recipe ingredient) --------------------------------------------------
const SwapOptionSchema = z.object({ name: text.max(60), note: text.max(240) })
/** Swaps are a bonus: a broken swaps array becomes [] instead of failing the whole recipe. */
const SwapsSchema = z.array(SwapOptionSchema).catch([])

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
  servings: z.coerce.number().int().min(1).max(30),
  difficulty: DifficultySchema,
  ingredients: z.array(RecipeIngredientSchema).min(1),
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
