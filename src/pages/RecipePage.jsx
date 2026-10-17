import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IMG } from '../data'
import { useIngredients } from '../hooks/useIngredients'
import { useRecipeFlow, recipeKeyFor } from '../hooks/useRecipeFlow'
import LoadingState from '../components/LoadingState/LoadingState'
import ErrorState from '../components/ErrorState/ErrorState'
import EmptyState from '../components/EmptyState/EmptyState'
import IngredientList from '../components/IngredientList/IngredientList'
import RecipeSteps from '../components/RecipeSteps/RecipeSteps'
export default function RecipePage() {
  const { id } = useParams()
  const { items } = useIngredients()
  const { suggestions, recipe: r, recipeKey, loadRecipe } = useRecipeFlow()

  const dish = suggestions.dishes.find((d) => d.id === id)
  const names = items.map((i) => i.name)

  useEffect(() => {
    if (dish) loadRecipe(dish, items.map((i) => i.name))
  }, [dish, items])

  // Suggestions only live in memory, so a page refresh or a pasted link lands here without a dish.
  if (!dish) {
    return (
      <main className="mx-auto max-w-[1160px] px-5 pt-[92px] max-[600px]:pt-[84px] max-[380px]:px-3.5">
        <EmptyState title="We lost track of that dish" text="Pick your ingredients again and choose a dish from the list." />
      </main>
    )
  }

  const key = recipeKeyFor(dish, names)
  let body
  if (recipeKey !== key || r.isLoading) {
    body = <LoadingState title={`Writing the recipe for ${dish.name}…`} hint="Steps and ingredient swaps take a little longer. Hang tight." />
  } else if (r.error) {
    body = <ErrorState error={r.error} onRetry={() => loadRecipe(dish, names, { force: true })} backTo="/results" backLabel="Back to dishes" />
  } else if (!r.recipe) {
    body = <LoadingState title="Preparing your recipe…" hint="Almost there." />
  } else {
    body = <RecipeView key={key} flow={r} />
  }

  return (
    <main className="mx-auto max-w-[1160px] px-5 pt-[92px] max-[600px]:pt-[84px] max-[380px]:px-3.5">
      <Link to="/results" className="mt-1.5 mb-[18px] inline-block cursor-pointer font-semibold text-body">&larr; Back to dishes</Link>
      {body}
    </main>
  )
}

function RecipeView({ flow }) {
  const { recipe, completedSteps: completed, toggleStep, picks, pickSwap, clearSwap, isUpdating, updateError, updateRecipe } = flow
  const [servings, setServings] = useState(recipe.servings)

  const pickCount = Object.keys(picks).length

  return (
    <>
      <div
        className="page-h mb-6 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(color-mix(in srgb, var(--color-cream) 88%, transparent), color-mix(in srgb, var(--color-cream) 88%, transparent)), url(${IMG.food})` }}
      >
        <div>
          <h2><span aria-hidden="true">{recipe.emoji} </span>{recipe.title}</h2>
          <p>{recipe.description}</p>
          <div className="meta mt-3">
            <span>{recipe.cuisine}</span><span>Prep {recipe.prepTime}</span><span>Cook {recipe.cookTime}</span><span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] items-start gap-7 max-[860px]:grid-cols-[minmax(0,1fr)]">
        <IngredientList recipe={recipe} servings={servings} setServings={setServings} isUpdating={isUpdating} picks={picks} pickSwap={pickSwap} clearSwap={clearSwap} />
        <RecipeSteps steps={recipe.steps} completed={completed} toggleStep={toggleStep} isUpdating={isUpdating} />
      </div>

      {(pickCount > 0 || isUpdating || updateError) && (
        <div
          className="fixed right-[max(16px,env(safe-area-inset-right,0px))] bottom-[calc(16px_+_env(safe-area-inset-bottom,0px))] z-20 flex w-[min(300px,calc(100vw_-_32px))] flex-col items-end gap-1.5 rounded-[20px] border-2 border-ink bg-paper px-3.5 py-3 text-right text-ink shadow-[6px_6px_0_var(--color-orange)] max-[640px]:right-4 max-[640px]:left-4 max-[640px]:w-auto max-[640px]:items-stretch max-[640px]:text-center"
          role="status" aria-live="polite"
        >
          {updateError && <small className="text-[.8rem] text-soft" role="alert">{updateError.message}</small>}
          <button className="btn w-full px-5 text-center whitespace-normal" onClick={() => updateRecipe(servings)}>
            {isUpdating ? 'Updating recipe…' : updateError ? 'Try again' : 'Update recipe'}
          </button>
          {updateError && !updateError.retryable && <Link className="lnk" to="/">Back to home</Link>}
          {!isUpdating && !updateError && <small className="text-[.8rem] text-soft">{pickCount} {pickCount === 1 ? 'swap' : 'swaps'} picked. Rewrite the recipe with {pickCount === 1 ? 'it' : 'them'}.</small>}
        </div>
      )}
      {/* keeps the last steps from hiding behind the floating bar */}
      {(pickCount > 0 || isUpdating || updateError) && <div className="h-[170px]" aria-hidden="true" />}
    </>
  )
}
