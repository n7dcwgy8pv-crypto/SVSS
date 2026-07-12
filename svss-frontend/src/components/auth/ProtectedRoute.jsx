import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Guards a route by role.
 *
 * - Not authenticated + customer route  → /customer/login
 * - Not authenticated + staff route     → /login
 * - Wrong role                          → role's own dashboard
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Route customer paths to the customer login, everything else to staff login
    const isCustomerRoute = location.pathname.startsWith('/customer')
    const loginPath = isCustomerRoute ? '/customer/login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Each role has its own home — never cross portals
    if (user?.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />
    if (user?.role === 'security') return <Navigate to="/security/dashboard" replace />
    return <Navigate to="/customer/dashboard" replace />
  }

  return children
}
