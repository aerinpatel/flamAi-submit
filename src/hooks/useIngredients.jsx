import { createContext, useContext, useState } from 'react'
import { MAX_INGREDIENTS } from '../constants'

const IngredientsContext = createContext(null)

// Shared ingredient list: [{ name, cat }]. Lives above the router outlet so it survives page changes.
export function IngredientsProvider({ children }) {
  const [items, setItems] = useState([])

  const value = {
    items,
    toggle: (name, cat) =>
      setItems((p) => (p.some((i) => i.name === name) ? p.filter((i) => i.name !== name) : p.length >= MAX_INGREDIENTS ? p : [...p, { name, cat }])),
    add: (name, cat) =>
      setItems((p) => (p.some((i) => i.name.toLowerCase() === name.toLowerCase()) || p.length >= MAX_INGREDIENTS ? p : [...p, { name, cat }])),
    removeLast: () => setItems((p) => p.slice(0, -1)),
  }

  return <IngredientsContext.Provider value={value}>{children}</IngredientsContext.Provider>
}

export function useIngredients() {
  const ctx = useContext(IngredientsContext)
  if (!ctx) throw new Error('useIngredients must be used inside <IngredientsProvider>')
  return ctx
}
