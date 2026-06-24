import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import StatCard from '../../components/dashboard/StatCard'
import Badge from '../../components/shared/Badge'
import { PageSpinner } from '../../components/shared/Spinner'
import { getDashboardStatsApi, getRecentScansApi } from '../../api/dashboardApi'
import { timeAgo } from '../../utils/helpers'
import './AdminDashboard.css'

function Ico({ d, size = 20, stroke = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}

const statIcons = {
  tickets:  <Ico d={<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></>} size={22} />,
  approved: <Ico d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} size={22} />,
  rejected: <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>} size={22} />,
  incidents:<Ico d={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} size={22} />,
}

const quickActions = [
  {
    to: '/admin/tickets/new',
    label: 'Create Ticket',
    sub: 'Issue new entry pass',
    icon: '➕',
    bg: 'rgba(16,185,129,.15)',
    border: 'rgba(16,185,129,.25)',
    color: '#10b981',
  },
  {
    to: '/admin/tickets',
    label: 'Manage Tickets',
    sub: 'Search & view all tickets',
    icon: '🎫',
    bg: 'rgba(79,142,255,.15)',
    border: 'rgba(79,142,255,.25)',
    color: '#4f8eff',
  },
  {
    to: '/admin/users',
    label: 'Manage Users',
    sub: 'User roles & access',
    icon: '👥',
    bg: 'rgba(0,212,255,.15)',
    border: 'rgba(0,212,255,.25)',
    color: '#00d4ff',
  },
  {
    to: '/admin/incidents',
    label: 'View Incidents',
    sub: 'Review reported events',
    icon: '⚠️',
    bg: 'rgba(239,68,68,.15)',
    border: 'rgba(239,68,68,.25)',
    color: '#ef4444',
  },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStatsApi(), getRecentScansApi()])
      .then(([s, r]) => { setStats(s); setScans(r) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title="Dashboard"><PageSpinner /></AppLayout>

  return (
    <AppLayout title="Dashboard">
      <div className="admin-dash">

        {/* ── Stats ── */}
        <section className="dash-section" aria-labelledby="stats-heading">
          <div className="dash-section-head">
            <h2 id="stats-heading" className="dash-section-title">Live Overview</h2>
          </div>
          <div className="stats-grid">
            <StatCard title="Total Tickets"    value={stats.totalTickets}
              subtitle={`${stats.validTickets} valid · ${stats.usedTickets} used`}
              variant="primary" icon={statIcons.tickets} />
            <StatCard title="Approved Entries" value={stats.approvedEntries}
              subtitle={`${stats.todayScans} scans today`}
              variant="success" icon={statIcons.approved} />
            <StatCard title="Rejected Entries" value={stats.rejectedEntries}
              subtitle="Access denied total"
              variant="danger" icon={statIcons.rejected} />
            <StatCard title="Open Incidents"   value={stats.openIncidents}
              subtitle={`${stats.totalIncidents} reported total`}
              variant="warning" icon={statIcons.incidents} />
          </div>
        </section>

        {/* ── Quick actions ── */}
        <section className="dash-section" aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="dash-section-title">Quick Actions</h2>
          <div className="quick-actions">
            {quickActions.map(a => (
              <Link
                key={a.to}
                to={a.to}
                className="quick-action"
                style={{ borderColor: a.border }}
                aria-label={a.label}
              >
                <div className="quick-action__icon" style={{ background: a.bg }}>
                  <span style={{ fontSize: 20 }} aria-hidden="true">{a.icon}</span>
                </div>
                <div>
                  <p className="quick-action__label" style={{ color: a.color }}>{a.label}</p>
                  <p className="quick-action__sub">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Scans ── */}
        <section className="dash-section" aria-labelledby="scans-heading">
          <div className="activity-card">
            <div className="activity-card__head">
              <h2 id="scans-heading" className="activity-card__title">Recent Entry Scans</h2>
              <span className="activity-card__badge">Live Feed</span>
            </div>
            <table className="activity-table" aria-label="Recent scan activity">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Visitor</th>
                  <th scope="col">Result</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.ticketId}</code></td>
                    <td style={{ color: 'var(--text-1)', fontWeight: 600 }}>{s.visitorName}</td>
                    <td>
                      <Badge variant={s.result === 'approved' ? 'success' : 'danger'}>
                        {s.result === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </Badge>
                    </td>
                    <td className="td-muted">{timeAgo(s.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppLayout>
  )
}
