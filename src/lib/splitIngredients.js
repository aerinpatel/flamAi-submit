/**
 * Turns what the user typed into a clean list of ingredient names.
 *   "eggs, tomato ,, onion"  ->  ["Eggs", "Tomato", "Onion"]
 * Splits on commas, semicolons and line breaks, trims, drops empties and repeats, capitalises the first letter.
 */
export function splitIngredients(text) {
  const seen = new Set()
  const out = []
  for (const part of String(text ?? '').split(/[,;\n]+/)) {
    const name = part.replace(/\s+/g, ' ').trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    out.push(name[0].toUpperCase() + name.slice(1))
  }
  return out
}
