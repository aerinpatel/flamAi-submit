export default function LoadingState({ title, hint, skeletons = 0 }) {
  return (
    <div role="status" aria-live="polite">
      <div className="state">
        <div className="spin" aria-hidden="true" />
        <h3>{title}</h3>
        <p>{hint}</p>
      </div>
      {skeletons > 0 && (
        <div className="mt-6 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-6 max-[860px]:grid-cols-[minmax(0,1fr)]" aria-hidden="true">
          {Array.from({ length: skeletons }, (_, i) => <div key={i} className="skel" />)}
        </div>
      )}
    </div>
  )
}
