/** Placeholder shown in a panel while the recipe is being rewritten. */
export default function PanelLoading({ text }) {
  return (
    <div role="status" aria-live="polite">
      <p>{text}</p>
      <div className="skel mb-3 min-h-[70px]" />
      <div className="skel mb-3 min-h-[70px]" />
      <div className="skel min-h-[70px]" />
    </div>
  )
}
