import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import './Sidebar.css'

const adminLinks = [
  { to: '/admin/dashboard',   label: 'Dashboard',    icon: 'grid',          color: '#4f8eff' },
  { to: '/admin/tickets',     label: 'Tickets',       icon: 'ticket',        color: '#a855f7' },
  { to: '/admin/tickets/new', label: 'Create Ticket', icon: 'plus-circle',   color: '#10b981' },
  { to: '/admin/users',       label: 'Users',         icon: 'users',         color: '#00d4ff' },
  { to: '/admin/reports',     label: 'Reports',       icon: 'bar-chart',     color: '#f59e0b' },
  { to: '/admin/incidents',   label: 'Incidents',     icon: 'alert-triangle',color: '#ef4444' },
]

const securityLinks = [
  { to: '/security/dashboard',  label: 'Dashboard',       icon: 'grid',           color: '#4f8eff' },
  { to: '/security/scanner',    label: 'QR Scanner',      icon: 'camera',         color: '#00d4ff' },
  { to: '/security/verify',     label: 'Verification',    icon: 'check-shield',   color: '#10b981' },
  { to: '/security/incidents',  label: 'Report Incident', icon: 'alert-triangle', color: '#ef4444' },
]

function Icon({ name, size = 16 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    ticket: <><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></>,
    'plus-circle': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    'bar-chart': <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    'alert-triangle': <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    'check-shield': <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    shield: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const links = user?.role === 'admin' ? adminLinks : securityLinks

  const handleLogout = () => {
    logout()
    toast.success('See you next time! 👋')
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">

        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo-ring">
            <Icon name="shield" size={18} />
          </div>
          <div className="sidebar__brand-text">
            <div className="sidebar__brand-name">SVSS</div>
            <div className="sidebar__brand-sub">Security System</div>
          </div>
        </div>

        {/* User */}
        <div className="sidebar__user" aria-label={`Logged in as ${user?.name}`}>
          <div className="sidebar__avatar" aria-hidden="true">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="sidebar__user-name">{user?.name}</p>
            <p className="sidebar__user-role">{user?.role === 'admin' ? 'Administrator' : 'Security Staff'}</p>
          </div>
        </div>

        {/* Nav */}
        <p className="sidebar__nav-label">Navigation</p>
        <nav aria-label="Sidebar navigation">
          <ul className="sidebar__nav" role="list">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to.endsWith('dashboard')}
                  className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                  onClick={onClose}
                  style={({ isActive }) => isActive ? { '--link-color': link.color } : {}}
                >
                  <span className="sidebar__link-icon">
                    <Icon name={link.icon} size={15} />
                  </span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <button className="sidebar__logout" onClick={handleLogout} aria-label="Log out of SVSS">
          <Icon name="log-out" size={16} />
          Sign Out
        </button>
      </aside>
    </>
  )
}
