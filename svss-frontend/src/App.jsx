import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import useAuthStore from './store/authStore'

// Public pages
import LoginPage    from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import NotFoundPage from './pages/public/NotFoundPage'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import TicketsPage     from './pages/admin/TicketsPage'
import CreateTicketPage from './pages/admin/CreateTicketPage'
import UsersPage       from './pages/admin/UsersPage'
import ReportsPage     from './pages/admin/ReportsPage'
import IncidentsPage   from './pages/admin/IncidentsPage'

// Security pages
import SecurityDashboard   from './pages/security/SecurityDashboard'
import ScannerPage         from './pages/security/ScannerPage'
import VerificationPage    from './pages/security/VerificationPage'
import IncidentReportPage  from './pages/security/IncidentReportPage'

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/security/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/admin/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/tickets" element={
        <ProtectedRoute allowedRoles={['admin']}><TicketsPage /></ProtectedRoute>
      } />
      <Route path="/admin/tickets/new" element={
        <ProtectedRoute allowedRoles={['admin']}><CreateTicketPage /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>
      } />
      <Route path="/admin/incidents" element={
        <ProtectedRoute allowedRoles={['admin']}><IncidentsPage /></ProtectedRoute>
      } />

      {/* Security routes */}
      <Route path="/security" element={
        <ProtectedRoute allowedRoles={['security']}>
          <Navigate to="/security/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/security/dashboard" element={
        <ProtectedRoute allowedRoles={['security']}><SecurityDashboard /></ProtectedRoute>
      } />
      <Route path="/security/scanner" element={
        <ProtectedRoute allowedRoles={['security']}><ScannerPage /></ProtectedRoute>
      } />
      <Route path="/security/verify" element={
        <ProtectedRoute allowedRoles={['security']}><VerificationPage /></ProtectedRoute>
      } />
      <Route path="/security/incidents" element={
        <ProtectedRoute allowedRoles={['security']}><IncidentReportPage /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
