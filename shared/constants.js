// Numbers used by both the server (prompts) and the client (limits, zod schemas).
export const SUGGESTION_COUNT = 2 // dishes returned per /api/suggest call
export const MAX_DISHES = 6 // "Generate more" stops here
export const MAX_INGREDIENTS = 20
export const MIN_STEPS = 4 // the model picks the step count per recipe, within this range
export const MAX_STEPS = 14
