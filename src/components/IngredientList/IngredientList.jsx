import { useState } from 'react'

export default function IngredientList({ recipe, servings, setServings }) {
  const scale = servings / recipe.servings

  const scaleAmount = (amountStr) => {
    return amountStr.replace(/^(\d+(?:\.\d+)?)/, (m) => {
      const n = parseFloat(m) * scale
      return Number.isInteger(n) ? n : n.toFixed(1)
    })
  }

  return (
    <div className="pnl">
      <div className="ph" style={{ marginBottom: 16 }}>
        <h3>Ingredients</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="chip" onClick={() => setServings((s) => Math.max(1, s - 1))}>-</button>
          <span>{servings} servings</span>
          <button className="chip" onClick={() => setServings((s) => Math.min(20, s + 1))}>+</button>
        </div>
      </div>
      <ul className="ing">
        {recipe.ingredients.map((ing) => (
          <li key={ing.id}>
            <div className="row">
              <span>{ing.name}</span>
              <b>{scaleAmount(ing.amount)}</b>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}