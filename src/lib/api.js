// Client side of the API: POST JSON to one of our /api routes, then validate the answer with zod (see schemas.js).

// Bad *output* is worth one more try (the model is not deterministic). Anything else fails fast.
const RETRY_CODES = new Set(['EMPTY_RESPONSE', 'MALFORMED_JSON', 'SCHEMA_MISMATCH', 'NULL_RESPONSE'])
const RETRYABLE = new Set([
  'EMPTY_RESPONSE', 'MALFORMED_JSON', 'INTERNAL_ERROR',
  'RATE_LIMITED', 'NETWORK_ERROR', 'TIMEOUT', 'UPSTREAM_ERROR', 'SCHEMA_MISMATCH', 'NULL_RESPONSE',
])

const buildError = (code, message) => ({ message, code, retryable: RETRYABLE.has(code) })

// `parse` is a zod parser from schemas.js: it returns { success, data } or { success: false, error, code }.
export async function callApi({ url, body, parse }) {
  const once = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        // No JSON body usually means the API is down (the dev proxy answers with an empty 5xx).
        return {
          ok: false,
          error: data
            ? buildError(data.code ?? 'INTERNAL_ERROR', data.error ?? 'Request failed')
            : buildError('NETWORK_ERROR', 'Could not reach the server. Check your connection.'),
        }
      }
      const parsed = parse(data)
      return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: buildError(parsed.code, parsed.error) }
    } catch (err) {
      console.error('[callApi] network error:', err)
      return { ok: false, error: buildError('NETWORK_ERROR', 'Could not reach the server. Check your connection.') }
    }
  }

  const result = await once()
  return !result.ok && RETRY_CODES.has(result.error.code) ? once() : result
}
