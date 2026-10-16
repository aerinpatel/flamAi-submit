import { useState } from 'react'
import PanelLoading from '../PanelLoading/PanelLoading'

const GLYPHS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }
const NUMBER = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛])/g
const NICE = [[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾']]

function toNumber(token) {
  if (GLYPHS[token]) return GLYPHS[token]
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return +mixed[1] + mixed[2] / mixed[3]
  const frac = token.match(/^(\d+)\/(\d+)$/)
  if (frac) return frac[1] / frac[2]
  return parseFloat(token)
}

function format(n) {
  if (n >= 10) return String(Math.round(n))
  const whole = Math.floor(n)
  const rest = n - whole
  if (rest < 0.05) return String(whole)
  if (rest > 0.95) return String(whole + 1)
  const hit = NICE.find(([v]) => Math.abs(rest - v) < 0.06)
  if (hit) return (whole ? String(whole) : '') + hit[1]
  return String(Math.round(n * 10) / 10)
}

/**
 * Scales every number in an amount string, e.g. ("200 g", 1.5) -> "300 g".
 * Amounts without a number ("to taste") are returned unchanged.
 */
function scaleAmount(amount, factor) {
  if (factor === 1) return amount
  return amount.replace(NUMBER, (t) => format(toNumber(t) * factor))
}

export default function IngredientList({ recipe, servings, setServings, isUpdating, picks, pickSwap, clearSwap }) {
  const [openId, setOpenId] = useState(null) // ingredient whose swap list is open
  const factor = servings / recipe.servings

  return (
    <aside className="pnl">
      <h3>Ingredients</h3>
      <div className="step">
        <span>Serving</span>
        <button aria-label="Fewer people" onClick={() => setServings((s) => Math.max(1, s - 1))}>&minus;</button>
        <strong>{servings}</strong>
        <button aria-label="More people" onClick={() => setServings((s) => Math.min(20, s + 1))}>+</button>
        <span>people</span>
      </div>
      {isUpdating ? (
        <PanelLoading text="Updating ingredients…" />
      ) : (
        <ul className="ing">
          {recipe.ingredients.map((ing) => {
            const pick = picks[ing.id]
            const open = openId === ing.id
            return (
              <li key={ing.id}>
                <div className="row">
                  <span>{ing.name}</span>
                  <strong>{scaleAmount(ing.amount, factor)}</strong>
                </div>
                {pick && <small className="swnote">Will swap to {pick.name}. {pick.note}</small>}
                <div className="swact">
                  {pick && <button className="lnk" onClick={() => clearSwap(ing.id)}>Undo swap</button>}
                  <button className="lnk" aria-expanded={open} onClick={() => setOpenId(open ? null : ing.id)}>
                    {open ? 'Hide swaps' : pick ? 'Other swaps' : 'Swap'}
                  </button>
                </div>
                {open && (
                  <div className="swp">
                    {ing.swaps.length === 0 && <p>No swaps suggested for this one.</p>}
                    {ing.swaps.map((o) => (
                      <button key={o.name} className="opt" onClick={() => { pickSwap(ing.id, o); setOpenId(null) }}>
                        <strong>{o.name}</strong><span>{o.note}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
