import PanelLoading from '../PanelLoading/PanelLoading'

export default function RecipeSteps({ steps, completed, toggleStep, isUpdating }) {
  const n = steps.length
  const done = steps.filter((s) => completed.has(s.id)).length
  const currentId = steps.find((s) => !completed.has(s.id))?.id

  return (
    <section className="pnl">
      <div className="ph"><h3>Steps</h3><span>{isUpdating ? 'Updating…' : done === n ? 'All done' : `${done} of ${n} done`}</span></div>
      {isUpdating ? (
        <PanelLoading text="Rewriting the steps with your swaps…" />
      ) : (
        <>
          <div className="bar"><i style={{ width: `${(done / n) * 100}%` }} /></div>
          <ol className="fl">
            {steps.map((s, i) =>
              completed.has(s.id) ? (
                <li key={s.id} className="sd">
                  <button onClick={() => toggleStep(s.id)} aria-label={`Undo step ${i + 1}`}>
                    <span className="ck">&#10003;</span><span>{s.title}</span>
                  </button>
                </li>
              ) : s.id === currentId ? (
                <li key={s.id} className="sc">
                  <small>Step {i + 1} of {n}{s.duration ? ` · ${s.duration}` : ''}</small>
                  <h4>{s.title}</h4>
                  <p>{s.instruction}</p>
                  {s.tip && <div className="tip"><strong>Chef's tip:</strong> {s.tip}</div>}
                  <button className="btn" onClick={() => toggleStep(s.id)}>Mark as done</button>
                </li>
              ) : (
                <li key={s.id} className="sq"><span className="qn">{i + 1}</span><span>{s.title}</span></li>
              )
            )}
            {done === n && <li className="sf">The dish is ready. Enjoy your meal!</li>}
          </ol>
        </>
      )}
    </section>
  )
}
