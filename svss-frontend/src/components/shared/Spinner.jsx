import './Spinner.css'

export default function Spinner({ size = 'md', label = 'Loading…' }) {
  return (
    <div className={`spinner-wrap spinner-wrap--${size}`} role="status" aria-label={label}>
      <div className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="page-spinner" role="status" aria-label={label}>
      <div className="spinner spinner--lg" />
      <p>{label}</p>
    </div>
  )
}
