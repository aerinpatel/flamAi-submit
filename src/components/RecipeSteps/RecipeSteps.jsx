import PanelLoading from '../PanelLoading/PanelLoading'

export default function RecipeSteps({ steps, completed, toggleStep, isUpdating }) {
  const n = steps.length
  const done = steps.filter((s) => completed.has(s.id)).length
  const currentId = steps.find((s) => !completed.has(s.id))?.id

  return (
    <section className="pnl">
      <div className="flex items-baseline justify-between">
        <h3 className="mb-3">Steps</h3>
        <span className="font-semibold text-orange">{isUpdating ? 'Updating…' : done === n ? 'All done' : `${done} of ${n} done`}</span>
      </div>
      {isUpdating ? (
        <PanelLoading text="Rewriting the steps with your swaps…" />
      ) : (
        <>
          <div className="mt-2.5 mb-[18px] h-2 overflow-hidden rounded-full bg-paper"><i className="block h-full bg-orange [transition:width_.25s]" style={{ width: `${(done / n) * 100}%` }} /></div>
          <ol className="flex list-none flex-col gap-2.5 p-0">
            {steps.map((s, i) =>
              completed.has(s.id) ? (
                <li key={s.id}>
                  <button
                    className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border-2 border-dashed border-line bg-transparent px-3.5 py-2.5 text-left text-ink opacity-65"
                    onClick={() => toggleStep(s.id)} aria-label={`Undo step ${i + 1}`}
                  >
                    <span className="flex size-6 flex-none items-center justify-center rounded-full bg-ink text-[.8rem] text-white">&#10003;</span>
                    <span className="line-through">{s.title}</span>
                  </button>
                </li>
              ) : s.id === currentId ? (
                <li key={s.id} className="min-w-0 rounded-[20px] bg-orange p-6 text-white shadow-[6px_6px_0_var(--color-ink)] max-[600px]:p-5 max-[600px]:shadow-[4px_4px_0_var(--color-ink)]">
                  <small className="font-semibold opacity-90">Step {i + 1} of {n}{s.duration ? ` · ${s.duration}` : ''}</small>
                  <h4 className="mt-1.5 mb-1 text-[1.3rem]">{s.title}</h4>
                  <p className="mt-2 mb-3.5 text-[1.02rem] leading-normal font-medium">{s.instruction}</p>
                  {s.tip && <div className="mb-4 rounded-xl bg-[rgba(255,255,255,.2)] px-3.5 py-2.5 text-[.95rem]"><strong>Chef's tip:</strong> {s.tip}</div>}
                  <button className="btn bg-paper text-ink hover:bg-ink hover:text-white" onClick={() => toggleStep(s.id)}>Mark as done</button>
                </li>
              ) : (
                <li key={s.id} className="flex items-center gap-3 px-3.5 py-2.5 text-soft">
                  <span className="flex size-6 flex-none items-center justify-center rounded-full border-2 border-line text-[.8rem]">{i + 1}</span>
                  <span>{s.title}</span>
                </li>
              )
            )}
            {done === n && <li className="rounded-[20px] bg-paper p-[22px] text-center font-semibold">The dish is ready. Enjoy your meal!</li>}
          </ol>
        </>
      )}
    </section>
  )
}
