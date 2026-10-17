import express from 'express'
import { generateJSON, modelName, sendError } from './_groq.js'
import { suggestPrompt, recipePrompt, swapPrompt } from './_prompts.js'
import { SUGGEST_TIMEOUT_MS, RECIPE_TIMEOUT_MS, SUGGEST_MAX_TOKENS, RECIPE_MAX_TOKENS } from '../src/constants/index.js'

const app = express()
app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, hasKey: Boolean(process.env.GROQ_API_KEY), model: modelName() }))

// The three LLM endpoints share one shape: build a prompt from the body, ask Groq, return the JSON.
// Checking the JSON's shape (zod) happens in the browser.
const llm = (buildPrompt, opts) => async (req, res) => {
  try {
    const data = await generateJSON({ prompt: buildPrompt(req.body ?? {}), ...opts })
    res.json(data)
  } catch (err) {
    sendError(res, err)
  }
}

app.post('/api/suggest', llm(suggestPrompt, { maxTokens: SUGGEST_MAX_TOKENS, timeoutMs: SUGGEST_TIMEOUT_MS }))
app.post('/api/recipe', llm(recipePrompt, { maxTokens: RECIPE_MAX_TOKENS, timeoutMs: RECIPE_TIMEOUT_MS }))
app.post('/api/swap', llm(swapPrompt, { maxTokens: RECIPE_MAX_TOKENS, timeoutMs: RECIPE_TIMEOUT_MS }))

// Unknown /api routes and wrong methods answer with JSON too.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }))

// Bad JSON bodies and anything unexpected come back as JSON, never as an HTML error page.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const badBody = err.type === 'entity.parse.failed' || err.type === 'entity.too.large'
  res.status(badBody ? 400 : 500).json({
    error: badBody ? 'Invalid request body' : 'Server error',
    code: badBody ? 'INVALID_INPUT' : 'INTERNAL_ERROR',
  })
})

// Locally we start our own server; on Vercel the app is exported and run as a serverless function (see api/index.js).
if (!process.env.VERCEL) {
  const port = process.env.PORT || 8787
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
}

export default app
