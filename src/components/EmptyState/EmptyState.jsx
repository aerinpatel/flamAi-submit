import { Link } from 'react-router-dom'

export default function EmptyState({ title, text, to = '/', label = 'Add ingredients' }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3"><Link className="btn max-[600px]:w-full max-[600px]:text-center" to={to}>{label}</Link></div>
    </div>
  )
}
