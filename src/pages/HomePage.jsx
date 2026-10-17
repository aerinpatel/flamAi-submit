import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, IMG } from '../data'
import { useIngredients } from '../hooks/useIngredients'
import CategoryCard from '../components/CategoryCard/CategoryCard'
import IngredientPicker from '../components/IngredientPicker/IngredientPicker'
import IngredientModal from '../components/IngredientModal/IngredientModal'

export default function HomePage() {
  const { items, toggle, add, removeLast } = useIngredients()
  const navigate = useNavigate()
  const [openCat, setOpenCat] = useState(null)

  return (
    <main>
      <header className="grid min-h-svh grid-cols-[1.1fr_.9fr] items-center gap-5 rounded-b-[36px] bg-cream px-hero pt-[110px] pb-14 text-ink max-[860px]:min-h-0 max-[860px]:grid-cols-[1fr] max-[860px]:content-center max-[860px]:justify-items-center max-[860px]:gap-7 max-[860px]:px-6 max-[860px]:pt-[104px] max-[860px]:pb-11 max-[860px]:text-center max-[380px]:px-[18px] max-[380px]:pt-24 max-[380px]:pb-9">
        <div>
          <h1>Cravings..</h1>
          <p className="mt-5 mb-[26px] max-w-[44ch] text-[length:clamp(1.08rem,1.3vw,1.35rem)] text-deep max-[860px]:mx-auto">Tell us what's in your kitchen. We'll suggest dishes you can cook right now, with steps made for your table.</p>
          <button className="btn" onClick={() => document.getElementById('pick')?.scrollIntoView({ behavior: 'smooth' })}>
            Add ingredients
          </button>
        </div>
        <div className="relative flex justify-center">
          <img className="w-[min(440px,78%)] max-[860px]:w-[min(280px,64%)]" src={IMG.chef2} alt="Chef with crossed arms" />
          <img className="absolute bottom-[-6%] left-0 w-[38%]" src={IMG.cloche} alt="Steaming serving dish" />
        </div>
      </header>

      <section className="mx-auto max-w-[1160px] px-5 pt-[72px] text-center max-[600px]:pt-12 max-[380px]:px-3.5" id="pick">
        <h2 className="mb-[22px]">What's in your kitchen?</h2>
        <p className="mx-auto mb-[26px] max-w-[56ch] text-muted">
          Type what you have and press Enter, or tap a suggestion. You can also browse by group below.
        </p>
        <IngredientPicker items={items} onAdd={add} onToggle={toggle} onRemoveLast={removeLast} onFind={() => navigate('/results')} />

        <h3 className="mt-14 text-[1.3rem] max-[600px]:mt-10">Or browse by group</h3>
        <div className="mt-11 grid grid-cols-[repeat(3,1fr)] gap-5 text-left max-[860px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[600px]:mt-7 max-[600px]:grid-cols-[minmax(0,1fr)] max-[600px]:gap-4">
          {CATEGORIES.map((c, k) => (
            <CategoryCard key={c.name} category={c} count={items.filter((i) => i.cat === k).length} onClick={() => setOpenCat(k)} />
          ))}
        </div>
      </section>

      <IngredientModal catIndex={openCat} items={items} onToggle={toggle} onAdd={add} onClose={() => setOpenCat(null)} />
    </main>
  )
}
