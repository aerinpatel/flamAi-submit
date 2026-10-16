import { useState } from 'react'
import { splitIngredients } from '../../lib/splitIngredients'

const SUGGESTIONS = ['Egg', 'Tomato', 'Onion', 'Potato', 'Garlic', 'Chicken', 'Rice', 'Milk', 'Cheese']

export default function IngredientPicker({ items, onAdd, onToggle, onRemoveLast, onFind }) {
  const [input, setInput] = useState('')

  const submit = () => {
    const parts = splitIngredients(input)
    for (const p of parts) onAdd(p)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Backspace' && !input && items.length) {
      onRemoveLast()
    }
  }

  const unused = SUGGESTIONS.filter((s) => !items.some((i) => i.name.toLowerCase() === s.toLowerCase()))

  return (
    <div className="tb">
      <div className="tbox" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
        <div className="chips">
          {items.map((it) => (
            <button key={it.name} type="button" className="chip sel" onClick={() => onToggle(it.name, it.cat)}>
              {it.name} &times;
            </button>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={items.length ? 'Add another ingredientâ€¦' : 'e.g. Potato, Tomato, Garlicâ€¦'}
          aria-label="Add an ingredient"
        />
      </div>

      <div className="sg">
        <p className="sub">Quick add:</p>
        <div className="chips">
          {unused.slice(0, 7).map((s) => (
            <button key={s} type="button" className="chip" onClick={() => onAdd(s)}>
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <span className="empty">{items.length} ingredients selected</span>
        <button className="btn" disabled={!items.length} onClick={onFind}>
          Find dishes
        </button>
      </div>
    </div>
  )
}