import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { callApi, newRequestId, parseSuggest, parseRecipe } from '../lib/api.js'
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

/**
 * useSuggestions: owns the `dishes` array.
 *   getSuggestions(ingredients)  starts over with the first 2 dishes
 *   loadMore(ingredients)        appends 2 more (asks the model to skip dishes already shown), up to MAX_DISHES
 * Every call gets a unique request id: only the answer of the latest id is used, callApi checks the echoed id.
 */
function useSuggestions() {
  const [dishes, setDishes] = useState(([]))
  const [isLoading, setIsLoading] = useState(false) // first batch
  const [isLoadingMore, setIsLoadingMore] = useState(false) // "generate more"
  const [error, setError] = useState(null) // first batch failed: nothing to show
  const [moreError, setMoreError] = useState(null) // "generate more" failed: keep the dishes we have
  const latestIdRef = useRef('')
  const controllerRef = useRef(null)
  const dishesRef = useRef(([])) // latest list, readable inside callbacks
  const busyRef = useRef(false)

  const setList = (next) => { dishesRef.current = next; setDishes(next) }

  useEffect(() => () => controllerRef.current?.abort(), [])

  /** Shared request. `more` decides which loading / error state is used and whether the list is replaced or extended. */
  const run = async (ingredients, { more }) => {
    controllerRef.current?.abort() // cancel any older request still in flight
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
    if (latestIdRef.current !== requestId) return // a newer request owns the state now

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
      // every dish was one we already show
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

const RECIPE_TIMEOUT_MS = 32000 // a full recipe takes longer than the dish list

/** Gives every ingredient and step an id built here (never trust the model for ids). */
const withIds = (r) => ({
  ...r,
  ingredients: r.ingredients.map((x, i) => ({ ...x, id: `ing-${i}` })),
  steps: r.steps.map((x, i) => ({ ...x, id: `step-${i}` })),
})

/**
 * useRecipe: the recipe and everything the user does with it.
 *   fetchRecipe(dish, names)  /api/recipe: first recipe for a dish
 *   pickSwap / clearSwap      the user chooses a substitute. This ONLY marks it; recipe and steps stay as they are.
 *   updateRecipe()            /api/swap: the model rewrites the whole recipe around the picked swaps, then it replaces
 *                             `recipe` (ingredients + steps). While it runs, `isUpdating` is true.
 * Every call has a unique request id; only the answer of the latest id is used.
 */
function useRecipe() {
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(false) // first recipe
  const [error, setError] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(() => new Set())
  const [picks, setPicks] = useState({}) // ingredient id -> { name, note }
  const [isUpdating, setIsUpdating] = useState(false) // rewriting after swaps
  const [updateError, setUpdateError] = useState(null) // rewrite failed: the old recipe stays on screen
  const latestIdRef = useRef('')
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  /** Aborts the previous call and returns the id + signal for the new one. */
  const startCall = () => {
    controllerRef.current?.abort()
    const requestId = newRequestId()
    latestIdRef.current = requestId
    controllerRef.current = new AbortController()
    return { requestId, signal: controllerRef.current.signal }
  }

  const fetchRecipe = async (dish, ingredients) => {
    const { requestId, signal } = startCall()
    setIsLoading(true)
    setIsUpdating(false)
    setError(null)
    setUpdateError(null)
    setRecipe(null)
    setCompletedSteps(new Set())
    setPicks({})

    const result = await callApi({
      url: '/api/recipe',
      body: { dishName: dish.name, description: dish.description, ingredients },
      requestId,
      parse: parseRecipe,
      timeoutMs: RECIPE_TIMEOUT_MS,
      signal,
    })
    if (latestIdRef.current !== requestId) return // a newer call owns the state now

    setIsLoading(false)
    if (!result.ok) { setError(result.error); return }
    setRecipe(withIds(result.data.recipe))
  }

  const toggleStep = (stepId) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const pickSwap = (ingredientId, option) => setPicks((p) => ({ ...p, [ingredientId]: option }))
  const clearSwap = (ingredientId) => setPicks(({ [ingredientId]: _removed, ...rest }) => rest)

  /** Sends the ingredient list with the picked swaps applied; the model returns a new recipe. */
  const updateRecipe = async (servings) => {
    const changes = recipe.ingredients.filter((i) => picks[i.id]).map((i) => ({ from: i.name, to: picks[i.id].name }))
    if (!changes.length) return

    const { requestId, signal } = startCall()
    setIsUpdating(true)
    setUpdateError(null)

    const result = await callApi({
      url: '/api/swap',
      body: {
        dishName: recipe.title,
        servings,
        ingredients: recipe.ingredients.map((i) => ({ name: picks[i.id]?.name ?? i.name, amount: i.amount })),
        changes,
      },
      requestId,
      parse: parseRecipe,
      timeoutMs: RECIPE_TIMEOUT_MS,
      signal,
    })
    if (latestIdRef.current !== requestId) return

    setIsUpdating(false)
    if (!result.ok) { setUpdateError(result.error); return }
    setRecipe(withIds(result.data.recipe))
    setCompletedSteps(new Set()) // the steps are new
    setPicks({})
  }

  return { recipe, isLoading, error, completedSteps, toggleStep, fetchRecipe, picks, pickSwap, clearSwap, isUpdating, updateError, updateRecipe }
}

// Keys describing "what a result was fetched for", so pages never show a result for different input.
export const suggestionsKey = (names) => names.join('|').toLowerCase()
export const recipeKeyFor = (dish, names) => [dish.id, dish.name, ...names].join('|').toLowerCase()

const Ctx = createContext(null)

/**
 * Holds the suggestions + recipe hooks above the router so results survive page changes.
 * `suggestKey` / `recipeKey` say which input the current result belongs to,
 * so a page can tell a fresh result from a stale one left over from earlier input.
 */
export function RecipeFlowProvider({ children }) {
  const suggestions = useSuggestions()
  const recipe = useRecipe()
  const { getSuggestions, loadMore } = suggestions
  const { fetchRecipe } = recipe

  const [suggestKey, setSuggestKey] = useState('')
  const [recipeKey, setRecipeKey] = useState('')
  const suggestKeyRef = useRef('')
  const recipeKeyRef = useRef('')

  const loadSuggestions = (names, { force = false } = {}) => {
    const key = suggestionsKey(names)
    if (!force && key === suggestKeyRef.current) return // already fetched (or fetching) for this input
    suggestKeyRef.current = key
    setSuggestKey(key)
    getSuggestions(names)
  }

  const loadRecipe = (dish, names, { force = false } = {}) => {
    const key = recipeKeyFor(dish, names)
    if (!force && key === recipeKeyRef.current) return
    recipeKeyRef.current = key
    setRecipeKey(key)
    fetchRecipe(dish, names)
  }

  const value = { suggestions, recipe, suggestKey, recipeKey, loadSuggestions, loadMoreSuggestions: loadMore, loadRecipe }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRecipeFlow() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecipeFlow must be used inside <RecipeFlowProvider>')
  return ctx
}
