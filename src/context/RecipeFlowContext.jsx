import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { callApi, newRequestId, parseSuggest } from '../lib/api.js'
import { MAX_DISHES } from '../../shared/constants.js'

const SUGGEST_TIMEOUT_MS = 20000

const addDishes = (current, incoming) => {
  const seen = new Set(current.map((d) => d.name.trim().toLowerCase()))
  const out = [...current]
  for (const dish of incoming) {
    if (out.length >= MAX_DISHES) break
    const key = dish.name.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...dish, id: `dish-${out.length}` })
  }
  return out
}

function useSuggestions() {
  const [dishes, setDishes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [moreError, setMoreError] = useState(null)
  const latestIdRef = useRef('')
  const controllerRef = useRef(null)
  const dishesRef = useRef([])
  const busyRef = useRef(false)

  const setList = (next) => { dishesRef.current = next; setDishes(next) }

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = async (ingredients, { more }) => {
    controllerRef.current?.abort()
    const requestId = newRequestId()
    latestIdRef.current = requestId
    const controller = new AbortController()
    controllerRef.current = controller
    busyRef.current = true

    if (more) { setIsLoadingMore(true); setMoreError(null) }
    else { setList([]); setIsLoading(true); setIsLoadingMore(false); setError(null); setMoreError(null) }

    const exclude = more ? dishesRef.current.map((d) => d.name) : []
    const result = await callApi({
      url: '/api/suggest',
      body: { ingredients, exclude },
      requestId,
      parse: parseSuggest,
      timeoutMs: SUGGEST_TIMEOUT_MS,
      signal: controller.signal,
    })
    if (latestIdRef.current !== requestId) return

    busyRef.current = false
    setIsLoading(false)
    setIsLoadingMore(false)

    if (!result.ok) {
      if (more) setMoreError(result.error)
      else setError(result.error)
      return
    }
    const next = addDishes(more ? dishesRef.current : [], result.data.suggestions)
    if (more && next.length === dishesRef.current.length) {
      setMoreError({ message: 'No new dishes this time. Try again.', code: 'NO_NEW_DISHES', retryable: true })
      return
    }
    setList(next)
  }

  const getSuggestions = (ingredients) => {
    if (!ingredients.length) return
    return run(ingredients, { more: false })
  }

  const loadMore = (ingredients) => {
    if (!ingredients.length || busyRef.current || dishesRef.current.length >= MAX_DISHES) return
    return run(ingredients, { more: true })
  }

  return {
    dishes, isLoading, isLoadingMore, error, moreError,
    canLoadMore: dishes.length > 0 && dishes.length < MAX_DISHES,
    getSuggestions, loadMore,
  }
}

export const suggestionsKey = (names) => names.join('|').toLowerCase()

const Ctx = createContext(null)

export function RecipeFlowProvider({ children }) {
  const suggestions = useSuggestions()
  const { getSuggestions, loadMore } = suggestions
  const [suggestKey, setSuggestKey] = useState('')
  const suggestKeyRef = useRef('')

  const loadSuggestions = (names, { force = false } = {}) => {
    const key = suggestionsKey(names)
    if (!force && key === suggestKeyRef.current) return
    suggestKeyRef.current = key
    setSuggestKey(key)
    getSuggestions(names)
  }

  const value = { suggestions, suggestKey, loadSuggestions, loadMoreSuggestions: loadMore }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRecipeFlow() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecipeFlow must be used inside <RecipeFlowProvider>')
  return ctx
}