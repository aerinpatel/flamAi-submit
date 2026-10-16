import { useState } from 'react'

export default function IngredientPicker({ items, onAdd, onToggle, onRemoveLast, onFind }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      onAdd(input.trim())
      setInput('')
    } else if (e.key === 'Backspace' && !input && items.length) {
      onRemoveLast()
    }
  }

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
      <div className="row">
        <span className="empty">{items.length} ingredients selected</span>
        <button className="btn" disabled={!items.length} onClick={onFind}>
          Find dishes
        </button>
      </div>
    </div>
  )
}