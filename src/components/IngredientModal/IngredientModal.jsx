import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../../data'
import { splitIngredients } from '../../lib/splitIngredients'

export default function IngredientModal({ catIndex, items, onToggle, onAdd, onClose }) {
  const ref = useRef(null)
  const [q, setQ] = useState('')
  const cat = catIndex ?? 0
  const c = CATEGORIES[cat]

  useEffect(() => {
    const d = ref.current
    if (catIndex !== null && !d.open) d.showModal()
    if (catIndex === null && d.open) d.close()
  }, [catIndex])

  const names = items.map((i) => i.name)
  const mine = items.filter((i) => i.cat === cat)
  const submit = (e) => {
    e.preventDefault()
    splitIngredients(q).forEach((name) => onAdd(name, cat))
    setQ('')
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="dt">
      <div className="mh">
        <h2 id="dt" style={{ fontSize: '1.7rem' }}>{c.name}</h2>
        <button className="x" aria-label="Close" onClick={() => ref.current.close()}>&times;</button>
      </div>
      <form className="sr" onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type one or more, separated by commas" autoComplete="off" aria-label="Search ingredient" />
        <button className="btn" type="submit">Add</button>
      </form>
      <div className="sub">Quick picks</div>
      <div className="chips">
        {c.options.map((o) => (
          <button key={o} className={'chip' + (names.includes(o) ? ' sel' : '')} onClick={() => onToggle(o, cat)}>{o}</button>
        ))}
      </div>
      <div className="sub">Added from this group</div>
      <div className="chips">
        {mine.length ? mine.map((i) => (
          <button key={i.name} className="chip sel" onClick={() => onToggle(i.name, cat)}>{i.name} &times;</button>
        )) : <span className="empty">Nothing yet</span>}
      </div>
      <div className="mf"><button className="btn" onClick={() => ref.current.close()}>Done</button></div>
    </dialog>
  )
}
