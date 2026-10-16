import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IMG } from '../data'
import { SUGGESTION_COUNT, MAX_DISHES } from '../../shared/constants'
import { useIngredients } from '../context/IngredientsContext'
import { useRecipeFlow, suggestionsKey } from '../context/RecipeFlowContext'
import LoadingState from '../components/LoadingState/LoadingState'
import ErrorState from '../components/ErrorState/ErrorState'
import EmptyState from '../components/EmptyState/EmptyState'
import DishCard from '../components/DishCard/DishCard'

export default function ResultsPage() {
  const { items } = useIngredients()
  const { suggestions: s, suggestKey, loadSuggestions, loadMoreSuggestions } = useRecipeFlow()
  const navigate = useNavigate()

  const names = items.map((i) => i.name)
  useEffect(() => {
    if (items.length) loadSuggestions(items.map((i) => i.name))
  }, [items, loadSuggestions])

  // Until the context has started a fetch for *these* ingredients, anything it holds is stale.
  const fresh = suggestKey === suggestionsKey(names)

  let body
  if (!items.length) {
    body = <EmptyState title="No ingredients yet" text="Add what's in your kitchen and we'll find dishes you can cook." />
  } else if (!fresh || s.isLoading) {
    body = <LoadingState title="Finding dishes…" hint="Asking the chef. This usually takes a few seconds." skeletons={SUGGESTION_COUNT} />
  } else if (s.error) {
    body = <ErrorState error={s.error} onRetry={() => loadSuggestions(names, { force: true })} />
  } else if (!s.dishes.length) {
    body = <EmptyState title="No dishes found" text="Try adding a few more ingredients." />
  } else {
    body = (
      <>
        <div className="two">
          {s.dishes.map((d) => (
            <DishCard key={d.id} dish={d} onClick={() => navigate(`/recipe/${d.id}`)} />
          ))}
          {s.isLoadingMore && Array.from({ length: SUGGESTION_COUNT }, (_, i) => <div key={`sk-${i}`} className="skel" aria-hidden="true" />)}
        </div>

        <div className="more" role="status" aria-live="polite">
          {s.moreError && <p role="alert">{s.moreError.message}</p>}
          {s.canLoadMore ? (
            <button className="btn" disabled={s.isLoadingMore} onClick={() => loadMoreSuggestions(names)}>
              {s.isLoadingMore ? 'Finding more dishes…' : s.moreError ? 'Try again' : 'Generate more dishes'}
            </button>
          ) : (
            <p>That's all {MAX_DISHES} dishes. Change the ingredients for fresh ideas.</p>
          )}
          <small>{s.dishes.length} of {MAX_DISHES} dishes</small>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" className="btn ghost">Change ingredients</Link>
        </p>
      </>
    )
  }

  return (
    <main className="view pad">
      <div className="page-h">
        <img src={IMG.fire} alt="Chef with flames behind" />
        <div>
          <h2>Dishes you can cook</h2>
          <p>Based on your ingredients:</p>
          <div className="chips" style={{ marginTop: 12 }}>
            {items.length
              ? items.map((i) => <span key={i.name} className="chip sel" style={{ cursor: 'default' }}>{i.name}</span>)
              : <span className="empty">No ingredients added</span>}
          </div>
        </div>
      </div>
      {body}
    </main>
  )
}
