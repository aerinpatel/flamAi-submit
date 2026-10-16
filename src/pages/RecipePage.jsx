import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IMG } from '../data'
import { useIngredients } from '../context/IngredientsContext'
import { useRecipeFlow, recipeKeyFor } from '../context/RecipeFlowContext'
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
      <main className="view pad">
        <EmptyState title="We lost track of that dish" text="Pick your ingredients again and choose a dish from the list." />
      </main>
    )
  }

  const key = recipeKeyFor(dish, names)
  let body
  if (recipeKey !== key || r.isLoading) {
    body = <LoadingState title={`Writing the recipe for ${dish.name}…`} hint="Steps and ingredient swaps take a little longer. Hang tight." />
  } else if (r.error) {
    body = <ErrorState error={r.error} onRetry={() => loadRecipe(dish, names, { force: true })} backTo={r.error.code === 'ID_MISMATCH' ? '/' : '/results'} backLabel={r.error.code === 'ID_MISMATCH' ? 'Back to home' : 'Back to dishes'} />
  } else if (!r.recipe) {
    body = <LoadingState title="Preparing your recipe…" hint="Almost there." />
  } else {
    body = <RecipeView key={key} flow={r} />
  }

  return (
    <main className="view pad">
      <Link to="/results" className="back" style={{ display: 'inline-block' }}>&larr; Back to dishes</Link>
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
        className="page-h bg"
        style={{ marginBottom: 24, backgroundImage: `linear-gradient(color-mix(in srgb, var(--cream) 88%, transparent), color-mix(in srgb, var(--cream) 88%, transparent)), url(${IMG.food})` }}
      >
        <div>
          <h2><span aria-hidden="true">{recipe.emoji} </span>{recipe.title}</h2>
          <p>{recipe.description}</p>
          <div className="meta" style={{ marginTop: 12 }}>
            <span>{recipe.cuisine}</span><span>Prep {recipe.prepTime}</span><span>Cook {recipe.cookTime}</span><span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="det">
        <IngredientList recipe={recipe} servings={servings} setServings={setServings} isUpdating={isUpdating} picks={picks} pickSwap={pickSwap} clearSwap={clearSwap} />
        <RecipeSteps steps={recipe.steps} completed={completed} toggleStep={toggleStep} isUpdating={isUpdating} />
      </div>

      {(pickCount > 0 || isUpdating || updateError) && (
        <div className="fab" role="status" aria-live="polite">
          {updateError && <small role="alert">{updateError.message}</small>}
          <button className="btn" disabled={isUpdating || (updateError && !updateError.retryable)} onClick={() => updateRecipe(servings)}>
            {isUpdating ? 'Updating recipe…' : updateError ? 'Try again' : 'Update recipe'}
          </button>
          {updateError && !updateError.retryable && <Link className="lnk" to="/">Back to home</Link>}
          {!isUpdating && !updateError && <small>{pickCount} {pickCount === 1 ? 'swap' : 'swaps'} picked. Rewrite the recipe with {pickCount === 1 ? 'it' : 'them'}.</small>}
        </div>
      )}
      {/* keeps the last steps from hiding behind the floating bar */}
      {(pickCount > 0 || isUpdating || updateError) && <div className="fab-space" aria-hidden="true" />}
    </>
  )
}
