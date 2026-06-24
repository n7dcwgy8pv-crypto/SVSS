import './Input.css'

export default function Select({ label, id, error, required = false, children, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <select
        id={id}
        className={`field__input ${error ? 'field__input--error' : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        required={required}
        style={{ appearance: 'auto' }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">{error}</p>
      )}
    </div>
  )
}
