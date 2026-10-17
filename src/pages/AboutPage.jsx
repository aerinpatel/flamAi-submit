import { Link } from 'react-router-dom'
import { AUTHOR, IMG, TECH } from '../data'

const HOW = [
  { img: 'vegetables', title: 'Add what you have', text: 'Type or tap the vegetables, fruits and proteins in your kitchen.' },
  { img: 'cloche', title: 'Pick a dish', text: 'Choose one of two dishes suggested from your ingredients.' },
  { img: 'food', title: 'Cook along', text: "Follow the steps, tick them off, and set how many people you're serving." },
]

export default function AboutPage() {
  return (
    <main className="view">
      <header className="ah">
        <div>
          <span className="eyebrow">About us</span>
          <h1>Cook what you already have.</h1>
          <p>Cravings.. turns the ingredients sitting in your kitchen into dishes you can cook tonight, with steps made for the number of people at your table.</p>
          <Link to="/" className="btn">Start cooking</Link>
        </div>
        <img src={IMG.man} alt="Cook flipping food in a pan" />
      </header>

      <section className="ab">
        <h2>How it works</h2>
        <div className="three">
          {HOW.map((h, i) => (
            <article key={h.title}>
              <img src={IMG[h.img]} alt="" />
              <b>{i + 1}</b>
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ab">
        <div className="sbox">
          <img className="me" src="/profile.jpg" alt={AUTHOR.name} />
          <div>
            <h2>About the project</h2>
            <p>
              Cravings.. is a fridge-to-recipe app. You list what you have, the app suggests dishes you can cook with it,
              and each dish opens into a recipe with steps to tick off, servings that rescale the amounts, and ingredient
              swaps for anything you're missing.
            </p>
            <p>
              Under the hood, a small Express server sends your ingredients to <b>gpt-oss-120b</b> on Groq, so the API key
              never reaches the browser. The model replies with JSON, which is validated with Zod before it is shown. Bad or
              slow replies are retried once, outdated responses are ignored, and every screen has loading, error and empty states.
            </p>
            <div className="tech">{TECH.map((t) => <span key={t}>{t}</span>)}</div>
            <p><a href={AUTHOR.github} target="_blank" rel="noopener noreferrer">See the code on GitHub &rarr;</a></p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Hungry yet?</h2>
        <Link to="/" className="btn">Add ingredients</Link>
      </section>
    </main>
  )
}
