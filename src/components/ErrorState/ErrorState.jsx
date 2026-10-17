import { Link } from 'react-router-dom'

export default function ErrorState({ error, onRetry, backTo = '/', backLabel = 'Change ingredients' }) {
  return (
    <div className="state border-2 border-orange" role="alert">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {error.retryable && <button className="btn max-[600px]:w-full max-[600px]:text-center" onClick={onRetry}>Try again</button>}
        <Link className="btn ghost max-[600px]:w-full max-[600px]:text-center" to={backTo}>{backLabel}</Link>
      </div>
    </div>
  )
}
