import { useNavigate } from 'react-router-dom'
import { CATEGORIES, IMG } from '../data'
import { useIngredients } from '../context/IngredientsContext'
import CategoryCard from '../components/CategoryCard/CategoryCard'
import IngredientPicker from '../components/IngredientPicker/IngredientPicker'

export default function HomePage() {
  const { items, toggle, add, removeLast } = useIngredients()
  const navigate = useNavigate()

  return (
    <main className="view">
      <header className="hero">
        <div>
          <h1>Cravings..</h1>
          <p>Tell us what's in your kitchen. We'll suggest dishes you can cook right now, with steps made for your table.</p>
          <button className="btn" onClick={() => document.getElementById('pick')?.scrollIntoView({ behavior: 'smooth' })}>
            Add ingredients
          </button>
        </div>
        <div className="art">
          <img className="a" src={IMG.chef2} alt="Chef with crossed arms" />
          <img className="b" src={IMG.cloche} alt="Steaming serving dish" />
        </div>
      </header>

      <section className="sec" id="pick">
        <h2>What's in your kitchen?</h2>
        <p style={{ maxWidth: '56ch', margin: '0 auto 26px', color: 'var(--muted)' }}>
          Type what you have and press Enter, or choose a category below.
        </p>
        <IngredientPicker items={items} onAdd={add} onToggle={toggle} onRemoveLast={removeLast} onFind={() => navigate('/results')} />

        <h3 className="or">Or browse by group</h3>
        <div className="grid">
          {CATEGORIES.map((c, k) => (
            <CategoryCard key={c.name} category={c} count={items.filter((i) => i.cat === k).length} onClick={() => {}} />
          ))}
        </div>
      </section>
    </main>
  )
}