import express from 'express'
import { generateJSON, modelName, sendError } from './groq.js'
import { suggestPrompt, recipePrompt, swapPrompt } from './prompts.js'

const app = express()
app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, hasKey: Boolean(process.env.GROQ_API_KEY), model: modelName() }))

// The three LLM endpoints share one shape: build a prompt from the body, ask Groq, return the JSON.
// Checking the JSON's shape (zod) happens in the browser. Timeouts stay below the browser's own.
// The request id sent by the browser is echoed back so the browser can tell which request an answer belongs to.
const llm = (buildPrompt, opts) => async (req, res) => {
  try {
    const data = await generateJSON({ prompt: buildPrompt(req.body ?? {}), ...opts })
    res.json({ ...data, requestId: req.body?.requestId })
  } catch (err) {
    sendError(res, err)
  }
}

app.post('/api/suggest', llm(suggestPrompt, { maxTokens: 1200, timeoutMs: 15000 }))
app.post('/api/recipe', llm(recipePrompt, { maxTokens: 6000, timeoutMs: 25000 }))
app.post('/api/swap', llm(swapPrompt, { maxTokens: 6000, timeoutMs: 25000 }))

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
