import { Link } from 'react-router-dom'

export default function EmptyState({ title, text, to = '/', label = 'Add ingredients' }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="acts"><Link className="btn" to={to}>{label}</Link></div>
    </div>
  )
}
