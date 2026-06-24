import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuthStore()
  const home = isAuthenticated
    ? user?.role === 'admin' ? '/admin/dashboard' : '/security/dashboard'
    : '/login'

  return (
    <div className="not-found">
      <div className="not-found__card">
        <div className="not-found__glitch" aria-hidden="true">404</div>
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__sub">
          This page doesn&apos;t exist or you don&apos;t have access.<br/>
          Let&apos;s get you back to safety.
        </p>
        <Link to={home} className="not-found__btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
