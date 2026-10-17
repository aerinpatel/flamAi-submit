/** Placeholder shown in a panel while the recipe is being rewritten. */
export default function PanelLoading({ text }) {
  return (
    <div role="status" aria-live="polite">
      <p>{text}</p>
      <div className="skel" style={{ minHeight: 70, marginBottom: 12 }} />
      <div className="skel" style={{ minHeight: 70, marginBottom: 12 }} />
      <div className="skel" style={{ minHeight: 70 }} />
    </div>
  )
}
