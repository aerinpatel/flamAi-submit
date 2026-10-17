import { Link } from 'react-router-dom'
import { AUTHOR, IMG, TECH } from '../data'

const HOW = [
  { img: 'vegetables', title: 'Add what you have', text: 'Type or tap the vegetables, fruits and proteins in your kitchen.' },
  { img: 'cloche', title: 'Pick a dish', text: 'Choose one of two dishes suggested from your ingredients.' },
  { img: 'food', title: 'Cook along', text: "Follow the steps, tick them off, and set how many people you're serving." },
]

export default function AboutPage() {
  return (
    <main>
      <header className="grid min-h-[70vh] grid-cols-[1.1fr_.9fr] items-center gap-8 rounded-b-[36px] bg-cream px-hero pt-[110px] pb-14 text-ink max-[860px]:min-h-0 max-[860px]:grid-cols-[1fr] max-[860px]:px-6 max-[860px]:pt-24 max-[860px]:pb-10">
        <div>
          <span className="mb-4 inline-block rounded-full bg-orange px-3.5 py-1 text-[.85rem] font-semibold text-white">About us</span>
          <h1 className="text-[length:clamp(2.6rem,6vw,5rem)] leading-none">Cook what you already have.</h1>
          <p className="mt-[18px] mb-[26px] max-w-[46ch] text-[1.1rem] text-deep">Cravings.. turns the ingredients sitting in your kitchen into dishes you can cook tonight, with steps made for the number of people at your table.</p>
          <Link to="/" className="btn">Start cooking</Link>
        </div>
        <img className="w-full max-w-[520px] justify-self-center" src={IMG.man} alt="Cook flipping food in a pan" />
      </header>

      <section className="mx-auto max-w-[1160px] px-5 pt-[72px] text-center max-[380px]:px-3.5">
        <h2>How it works</h2>
        <div className="mt-9 grid grid-cols-[repeat(3,1fr)] gap-5 text-left max-[860px]:grid-cols-[1fr]">
          {HOW.map((h, i) => (
            <article key={h.title} className="rounded-[22px] bg-cream p-[22px] text-ink">
              <img className="mx-auto mb-3 block h-[130px]" src={IMG[h.img]} alt="" />
              <b className="inline-flex size-[34px] items-center justify-center rounded-full bg-orange text-white">{i + 1}</b>
              <h3 className="mt-2.5 mb-1">{h.title}</h3>
              <p className="text-deep">{h.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-5 pt-[72px] text-center max-[380px]:px-3.5">
        <div className="grid grid-cols-[minmax(200px,260px)_minmax(0,1fr)] items-center gap-[clamp(24px,4vw,56px)] rounded-[28px] bg-orange px-11 py-9 text-left text-white max-[860px]:grid-cols-[1fr] max-[860px]:p-7">
          <img className="aspect-square w-full rounded-full bg-cream object-cover object-top max-[860px]:mx-auto max-[860px]:max-w-[220px]" src="/profile.jpg" alt={AUTHOR.name} />
          <div>
            <h2>About the project</h2>
            <p className="mt-3.5 text-[1.05rem] leading-[1.65]">
              Cravings.. is a fridge-to-recipe app. You list what you have, the app suggests dishes you can cook with it,
              and each dish opens into a recipe with steps to tick off, servings that rescale the amounts, and ingredient
              swaps for anything you're missing.
            </p>
            <p className="mt-3.5 text-[1.05rem] leading-[1.65]">
              Under the hood, a small Express API sends your ingredients to <b>gpt-oss-120b</b> on Groq, so the API key
              never reaches the browser. The model replies with JSON, which is validated with Zod before it is shown. Bad
              replies are retried once, and every screen has loading, error and empty states.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">{TECH.map((t) => <span key={t} className="rounded-full bg-cream px-3 py-1 text-[.85rem] font-semibold text-ink">{t}</span>)}</div>
            <p className="mt-3.5 text-[1.05rem] leading-[1.65]"><a className="font-semibold text-white" href={AUTHOR.github} target="_blank" rel="noopener noreferrer">See the code on GitHub &rarr;</a></p>
          </div>
        </div>
      </section>

      <section className="px-5 pt-20 pb-5 text-center">
        <h2 className="mb-5">Hungry yet?</h2>
        <Link to="/" className="btn">Add ingredients</Link>
      </section>
    </main>
  )
}
