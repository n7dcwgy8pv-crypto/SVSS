import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import useAuthStore from './store/authStore'

// Staff auth pages
import LoginPage    from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import NotFoundPage from './pages/public/NotFoundPage'

// Customer auth pages (dedicated, isolated)
import CustomerLoginPage    from './pages/customer/CustomerLoginPage'
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage'

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard'
import TicketsPage      from './pages/admin/TicketsPage'
import CreateTicketPage from './pages/admin/CreateTicketPage'
import AdminEventsPage  from './pages/admin/EventsPage'
import CreateEventPage  from './pages/admin/CreateEventPage'
import UsersPage        from './pages/admin/UsersPage'
import ReportsPage      from './pages/admin/ReportsPage'
import IncidentsPage    from './pages/admin/IncidentsPage'

// Security pages
import SecurityDashboard  from './pages/security/SecurityDashboard'
import ScannerPage        from './pages/security/ScannerPage'
import VerificationPage   from './pages/security/VerificationPage'
import IncidentReportPage from './pages/security/IncidentReportPage'

// Customer portal pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import EventsPage        from './pages/customer/EventsPage'
import EventDetailPage   from './pages/customer/EventDetailPage'
import MyTicketsPage     from './pages/customer/MyTicketsPage'

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />
  if (user?.role === 'security') return <Navigate to="/security/dashboard" replace />
  return <Navigate to="/customer/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Staff auth ── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Customer auth (dedicated, isolated) ── */}
      <Route path="/customer/login"    element={<CustomerLoginPage />} />
      <Route path="/customer/register" element={<CustomerRegisterPage />} />

      {/* ── Admin routes ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/admin/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/events" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminEventsPage /></ProtectedRoute>
      } />
      <Route path="/admin/events/new" element={
        <ProtectedRoute allowedRoles={['admin']}><CreateEventPage /></ProtectedRoute>
      } />
      <Route path="/admin/events/:eventId/edit" element={
        <ProtectedRoute allowedRoles={['admin']}><CreateEventPage /></ProtectedRoute>
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

      {/* ── Security routes ── */}
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

      {/* ── Customer portal routes ── */}
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <Navigate to="/customer/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/customer/dashboard" element={
        <ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>
      } />
      <Route path="/customer/events" element={
        <ProtectedRoute allowedRoles={['customer']}><EventsPage /></ProtectedRoute>
      } />
      <Route path="/customer/events/:eventId" element={
        <ProtectedRoute allowedRoles={['customer']}><EventDetailPage /></ProtectedRoute>
      } />
      <Route path="/customer/tickets" element={
        <ProtectedRoute allowedRoles={['customer']}><MyTicketsPage /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
