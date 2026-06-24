import './Input.css'

export default function Textarea({ label, id, error, required = false, rows = 4, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`field__input ${error ? 'field__input--error' : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        required={required}
        style={{ resize: 'vertical' }}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">{error}</p>
      )}
    </div>
  )
}
