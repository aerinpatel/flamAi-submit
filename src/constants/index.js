// Limits used by both the api (prompts) and the client (zod schemas, UI).
export const MAX_INGREDIENTS = 20 // ingredients the user can add
export const MIN_STEPS = 7 // the model picks the step count per recipe, within this range
export const MAX_STEPS = 14

// Server only: how long Groq may take and how many tokens it may write.
export const SUGGEST_TIMEOUT_MS = 15000
export const RECIPE_TIMEOUT_MS = 25000
export const SUGGEST_MAX_TOKENS = 1200
export const RECIPE_MAX_TOKENS = 6000
