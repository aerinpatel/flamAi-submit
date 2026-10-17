import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IMG } from '../data'
import { useIngredients } from '../hooks/useIngredients'
import { useRecipeFlow, suggestionsKey } from '../hooks/useRecipeFlow'
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
    body = <LoadingState title="Finding dishes…" hint="Asking the chef. This usually takes a few seconds." skeletons={2} />
  } else if (s.error) {
    body = <ErrorState error={s.error} onRetry={() => loadSuggestions(names, { force: true })} />
  } else if (!s.dishes.length) {
    body = <EmptyState title="No dishes found" text="Try adding a few more ingredients." />
  } else {
    body = (
      <>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-6 max-[860px]:grid-cols-[minmax(0,1fr)]">
          {s.dishes.map((d) => (
            <DishCard key={d.id} dish={d} onClick={() => navigate(`/recipe/${d.id}`)} />
          ))}
          {s.isLoadingMore && Array.from({ length: 2 }, (_, i) => <div key={`sk-${i}`} className="skel" aria-hidden="true" />)}
        </div>

        <div className="mt-7 flex flex-col items-center gap-2 text-center" role="status" aria-live="polite">
          {s.moreError && <p role="alert">{s.moreError.message}</p>}
          {s.canLoadMore ? (
            <button className="btn max-[600px]:w-full" onClick={() => loadMoreSuggestions(names)}>
              {s.isLoadingMore ? 'Finding more dishes…' : s.moreError ? 'Try again' : 'Generate more dishes'}
            </button>
          ) : (
            <p>That's all 6 dishes. Change the ingredients for fresh ideas.</p>
          )}
          <small className="text-muted">{s.dishes.length} of 6 dishes</small>
        </div>

        <p className="mt-5 text-center">
          <Link to="/" className="btn ghost">Change ingredients</Link>
        </p>
      </>
    )
  }

  return (
    <main className="mx-auto max-w-[1160px] px-5 pt-[92px] max-[600px]:pt-[84px] max-[380px]:px-3.5">
      <div className="page-h">
        <img src={IMG.fire} alt="Chef with flames behind" />
        <div>
          <h2>Dishes you can cook</h2>
          <p>Based on your ingredients:</p>
          <div className="mt-3 flex flex-wrap gap-2 max-[860px]:justify-center">
            {items.length
              ? items.map((i) => <span key={i.name} className="chip sel cursor-default">{i.name}</span>)
              : <span className="text-[.95rem] text-soft">No ingredients added</span>}
          </div>
        </div>
      </div>
      {body}
    </main>
  )
}
