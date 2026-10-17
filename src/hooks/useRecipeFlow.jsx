import { createContext, useContext, useRef, useState } from 'react'
import { callApi } from '../lib/api.js'
import { parseSuggest, parseRecipe } from '../lib/schemas.js'

const addDishes = (current, incoming) => {
  const seen = new Set(current.map((d) => d.name.trim().toLowerCase()))
  const out = [...current]
  for (const dish of incoming) {
    if (out.length >= 6) break
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
 *   loadMore(ingredients)        appends 2 more (asks the model to skip dishes already shown), up to 6 dishes
 */
function useSuggestions() {
  const [dishes, setDishes] = useState([])
  const [isLoading, setIsLoading] = useState(false) // first batch
  const [isLoadingMore, setIsLoadingMore] = useState(false) // "generate more"
  const [error, setError] = useState(null) // first batch failed: nothing to show
  const [moreError, setMoreError] = useState(null) // "generate more" failed: keep the dishes we have

  const getSuggestions = async (ingredients) => {
    setDishes([])
    setIsLoading(true)
    setError(null)
    setMoreError(null)

    const result = await callApi({ url: '/api/suggest', body: { ingredients, exclude: [] }, parse: parseSuggest })

    setIsLoading(false)
    if (!result.ok) { setError(result.error); return }
    setDishes(addDishes([], result.data.suggestions))
  }

  const loadMore = async (ingredients) => {
    setIsLoadingMore(true)
    setMoreError(null)

    const result = await callApi({ url: '/api/suggest', body: { ingredients, exclude: dishes.map((d) => d.name) }, parse: parseSuggest })

    setIsLoadingMore(false)
    if (!result.ok) { setMoreError(result.error); return }
    const next = addDishes(dishes, result.data.suggestions)
    if (next.length === dishes.length) {
      // every dish was one we already show
      setMoreError({ message: 'No new dishes this time. Try again.', code: 'NO_NEW_DISHES', retryable: true })
      return
    }
    setDishes(next)
  }

  return {
    dishes, isLoading, isLoadingMore, error, moreError,
    canLoadMore: dishes.length > 0 && dishes.length < 6,
    getSuggestions, loadMore,
  }
}

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
 */
function useRecipe() {
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(false) // first recipe
  const [error, setError] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(() => new Set())
  const [picks, setPicks] = useState({}) // ingredient id -> { name, note }
  const [isUpdating, setIsUpdating] = useState(false) // rewriting after swaps
  const [updateError, setUpdateError] = useState(null) // rewrite failed: the old recipe stays on screen

  const fetchRecipe = async (dish, ingredients) => {
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
      parse: parseRecipe,
    })

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
      parse: parseRecipe,
    })

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
