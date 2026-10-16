import { AUTHOR } from '../../data'

export default function Footer() {
  return (
    <footer>
      © Cravings.. · Built by {AUTHOR.name} ·{' '}
      <a href={AUTHOR.github} target="_blank" rel="noopener noreferrer">GitHub</a>
    </footer>
  )
}
