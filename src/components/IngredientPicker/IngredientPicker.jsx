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
    <div className="tb">
      <div className="tbox" onClick={() => ref.current?.focus()}>
        <div className="chips">
          {items.map((i) => (
            <button key={i.name} className="chip sel" onClick={() => onToggle(i.name, i.cat)}>{i.name} &times;</button>
          ))}
        </div>
        <input ref={ref} value={q} onChange={onChange} onKeyDown={onKeyDown}
          placeholder="Type ingredients, e.g. tomato, onion, rice" autoComplete="off" aria-label="Add ingredient" />
      </div>

      <div className="sg">
        <div className="sub">{title}</div>
        <div className="chips">
          {list.slice(0, 10).map((a) => (
            <button key={a.name} className="chip" onClick={() => pick(a.name, a.cat)}>+ {a.name}</button>
          ))}
        </div>
      </div>

      <div className="row">
        <span className="empty">{items.length ? `${items.length} added` : 'Nothing added yet.'}</span>
        <button className="btn" disabled={!items.length} onClick={onFind}>Find dishes</button>
      </div>
    </div>
  )
}
