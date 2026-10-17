import { useRef, useState } from 'react'
import { ALL, CATEGORIES } from '../../data'
import { splitIngredients } from '../../lib/splitIngredients'

// The text box with chips inside, plus the suggestions row below it.
export default function IngredientPicker({ items, onAdd, onToggle, onRemoveLast, onFind }) {
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const names = items.map((i) => i.name)
  const query = q.trim().toLowerCase()

  let list = []
  if (query) {
    list = ALL.filter((a) => a.name.toLowerCase().includes(query) && !names.includes(a.name))
  } else {
    const n = Math.max(...CATEGORIES.map((c) => c.options.length))
    for (let i = 0; i < n; i++)
      CATEGORIES.forEach((c, cat) => {
        const name = c.options[i]
        if (name && !names.includes(name)) list.push({ name, cat })
      })
  }
  const title = query ? (list.length ? 'Matches' : 'No match. Press Enter to add it') : items.length ? 'You may also have' : 'Suggestions'

  const pick = (name, cat) => { onAdd(name, cat); setQ(''); ref.current?.focus() }

  // Adds every comma-separated part of `text` as its own ingredient. Known names reuse their category.
  const addMany = (text) => {
    for (const part of splitIngredients(text)) {
      const lower = part.toLowerCase()
      const m = ALL.find((a) => a.name.toLowerCase() === lower)
      onAdd(m ? m.name : part, m ? m.cat : 0)
    }
  }

  // Typing or pasting a comma commits everything before the last comma; the rest stays in the box.
  const onChange = (e) => {
    const v = e.target.value
    const cut = Math.max(v.lastIndexOf(','), v.lastIndexOf(';'), v.lastIndexOf('\n'))
    if (cut === -1) { setQ(v); return }
    addMany(v.slice(0, cut))
    setQ(v.slice(cut + 1).replace(/^\s+/, ''))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = q.trim()
      if (!v) return
      // A single word that starts like a known ingredient picks it ("tom" -> Tomato); a list is added as typed.
      const lower = v.toLowerCase()
      const m = !/[,;]/.test(v) && (ALL.find((a) => a.name.toLowerCase() === lower) || ALL.find((a) => a.name.toLowerCase().startsWith(lower)))
      if (m) pick(m.name, m.cat)
      else { addMany(v); setQ('') }
    } else if (e.key === 'Backspace' && !q && items.length) {
      onRemoveLast()
    }
  }

  return (
    <div className="mx-auto max-w-[720px] text-left">
      <div
        className="flex min-h-[68px] cursor-text flex-wrap items-center gap-2 rounded-[20px] border-2 border-ink bg-paper px-4 py-3.5 text-ink shadow-[8px_8px_0_var(--color-orange)] focus-within:border-orange max-[600px]:p-3 max-[600px]:shadow-[5px_5px_0_var(--color-orange)]"
        onClick={() => ref.current?.focus()}
      >
        <div className="contents">
          {items.map((i) => (
            <button key={i.name} className="chip sel" onClick={() => onToggle(i.name, i.cat)}>{i.name} &times;</button>
          ))}
        </div>
        <input
          className="min-w-[170px] flex-1 border-0 bg-transparent px-1.5 py-2 text-[1rem] text-ink outline-none max-[600px]:min-w-[120px]"
          ref={ref} value={q} onChange={onChange} onKeyDown={onKeyDown}
          placeholder="Type ingredients, e.g. tomato, onion, rice" autoComplete="off" aria-label="Add ingredient"
        />
      </div>

      <div className="mt-[26px]">
        <div className="mb-2.5 font-semibold">{title}</div>
        <div className="flex flex-wrap gap-2.5">
          {list.slice(0, 10).map((a) => (
            <button key={a.name} className="chip border-transparent bg-cream hover:border-orange" onClick={() => pick(a.name, a.cat)}>+ {a.name}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3.5 max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:text-center">
        <span className="text-[.95rem] text-muted">{items.length ? `${items.length} added` : 'Nothing added yet.'}</span>
        <button className="btn max-[600px]:w-full" disabled={!items.length} onClick={onFind}>Find dishes</button>
      </div>
    </div>
  )
}
