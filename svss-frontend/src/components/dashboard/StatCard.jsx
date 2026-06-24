import { useEffect, useRef, useState } from 'react'
import './StatCard.css'

/**
 * Animates a number from 0 → target on mount using an
 * ease-out cubic rAF loop. Falls back gracefully for
 * non-numeric values.
 */
function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target == null || isNaN(Number(target))) {
      setDisplay(target) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }

    const end   = Number(target)
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(eased * end))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return display
}

export default function StatCard({ title, value, subtitle, variant = 'default', icon }) {
  const animated   = useCountUp(value)
  const displayVal = (value != null && !isNaN(Number(value))) ? animated : (value ?? '—')

  return (
    <div className={`stat-card stat-card--${variant}`} role="region" aria-label={`${title}: ${value}`}>
      <div className="stat-card__orb" aria-hidden="true" />
      <div className="stat-card__head">
        <div>
          <p className="stat-card__label">{title}</p>
          <p className="stat-card__value" aria-live="polite">{displayVal}</p>
        </div>
        {icon && <div className="stat-card__icon" aria-hidden="true">{icon}</div>}
      </div>
      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
    </div>
  )
}
