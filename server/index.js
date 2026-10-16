import express from 'express'
import { generateJSON, modelName, sendError } from './groq.js'
import { suggestPrompt, recipePrompt } from './prompts.js'

const app = express()
app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, hasKey: Boolean(process.env.GROQ_API_KEY), model: modelName() }))

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

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }))

app.use((err, _req, res, _next) => {
  const badBody = err.type === 'entity.parse.failed' || err.type === 'entity.too.large'
  res.status(badBody ? 400 : 500).json({
    error: badBody ? 'Invalid request body' : 'Server error',
    code: badBody ? 'INVALID_INPUT' : 'INTERNAL_ERROR',
  })
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))