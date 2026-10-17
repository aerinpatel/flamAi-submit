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

const STEP_BTN = 'size-10 cursor-pointer rounded-full border-2 border-ink bg-paper text-[1.2rem] text-ink max-[600px]:size-11'

export default function IngredientList({ recipe, servings, setServings, isUpdating, picks, pickSwap, clearSwap }) {
  const [openId, setOpenId] = useState(null) // ingredient whose swap list is open
  const factor = servings / recipe.servings

  return (
    <aside className="pnl">
      <h3 className="mb-3">Ingredients</h3>
      <div className="my-3.5 flex items-center gap-3">
        <span>Serving</span>
        <button className={STEP_BTN} aria-label="Fewer people" onClick={() => setServings((s) => Math.max(1, s - 1))}>&minus;</button>
        <strong>{servings}</strong>
        <button className={STEP_BTN} aria-label="More people" onClick={() => setServings((s) => Math.min(30, s + 1))}>+</button>
        <span>people</span>
      </div>
      {isUpdating ? (
        <PanelLoading text="Updating ingredients…" />
      ) : (
        <ul className="list-none p-0">
          {recipe.ingredients.map((ing) => {
            const pick = picks[ing.id]
            const open = openId === ing.id
            return (
              <li key={ing.id} className="py-[9px] [border-bottom:1px_dashed_var(--color-line)]">
                <div className="flex justify-between gap-3">
                  <span className="[overflow-wrap:break-word]">{ing.name}</span>
                  <strong className="[overflow-wrap:break-word]">{scaleAmount(ing.amount, factor)}</strong>
                </div>
                {pick && <small className="mt-0.5 block text-[.85rem] text-soft">Will swap to {pick.name}. {pick.note}</small>}
                <div className="mt-0.5 flex gap-3.5">
                  {pick && <button className="lnk" onClick={() => clearSwap(ing.id)}>Undo swap</button>}
                  <button className="lnk" aria-expanded={open} onClick={() => setOpenId(open ? null : ing.id)}>
                    {open ? 'Hide swaps' : pick ? 'Other swaps' : 'Swap'}
                  </button>
                </div>
                {open && (
                  <div className="mt-2 grid gap-2 text-[.9rem]">
                    {ing.swaps.length === 0 && <p>No swaps suggested for this one.</p>}
                    {ing.swaps.map((o) => (
                      <button
                        key={o.name}
                        className="flex cursor-pointer flex-col gap-0.5 rounded-[14px] border-2 border-transparent bg-paper px-3.5 py-2.5 text-left text-ink hover:border-orange focus-visible:border-orange"
                        onClick={() => { pickSwap(ing.id, o); setOpenId(null) }}
                      >
                        <strong>{o.name}</strong><span className="text-[.85rem] text-soft">{o.note}</span>
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
