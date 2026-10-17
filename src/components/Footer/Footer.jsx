import { AUTHOR } from '../../data'

export default function Footer() {
  return (
    <footer className="px-5 py-[30px] text-center text-[.9rem] text-muted">
      © Cravings.. · Built by {AUTHOR.name} ·{' '}
      <a className="font-semibold text-orange no-underline hover:underline" href={AUTHOR.github} target="_blank" rel="noopener noreferrer">GitHub</a>
    </footer>
  )
}
