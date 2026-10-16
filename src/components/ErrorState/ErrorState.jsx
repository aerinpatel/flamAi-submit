import { Link } from 'react-router-dom'

export default function ErrorState({ error, onRetry, backTo = '/', backLabel = 'Change ingredients' }) {
  return (
    <div className="state err" role="alert">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <div className="acts">
        {error.retryable && <button className="btn" onClick={onRetry}>Try again</button>}
        <Link className="btn ghost" to={backTo}>{backLabel}</Link>
      </div>
    </div>
  )
}
