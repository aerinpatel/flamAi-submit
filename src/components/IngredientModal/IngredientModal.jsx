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
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dt"
      className="m-auto w-[min(560px,92vw)] rounded-3xl border-2 border-ink bg-paper p-7 text-ink backdrop:bg-[rgba(29,29,29,.55)] max-[600px]:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="dt" className="text-[1.7rem]">{c.name}</h2>
        <button className="size-[38px] cursor-pointer rounded-full border-2 border-ink bg-transparent text-[1.1rem] text-ink max-[600px]:size-11" aria-label="Close" onClick={() => ref.current.close()}>&times;</button>
      </div>
      <form className="mb-[18px] flex gap-2.5 max-[600px]:flex-wrap" onSubmit={submit}>
        <input
          className="min-w-0 flex-1 rounded-full border-2 border-ink bg-white px-[18px] py-3 text-ink max-[600px]:basis-full"
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type one or more, separated by commas" autoComplete="off" aria-label="Search ingredient"
        />
        <button className="btn max-[600px]:flex-1" type="submit">Add</button>
      </form>
      <div className="mt-3.5 mb-2 font-semibold">Quick picks</div>
      <div className="flex flex-wrap gap-2">
        {c.options.map((o) => (
          <button key={o} className={'chip' + (names.includes(o) ? ' sel' : '')} onClick={() => onToggle(o, cat)}>{o}</button>
        ))}
      </div>
      <div className="mt-3.5 mb-2 font-semibold">Added from this group</div>
      <div className="flex flex-wrap gap-2">
        {mine.length ? mine.map((i) => (
          <button key={i.name} className="chip sel" onClick={() => onToggle(i.name, cat)}>{i.name} &times;</button>
        )) : <span className="text-[.95rem] text-soft">Nothing yet</span>}
      </div>
      <div className="mt-[22px] flex justify-end"><button className="btn" onClick={() => ref.current.close()}>Done</button></div>
    </dialog>
  )
}
