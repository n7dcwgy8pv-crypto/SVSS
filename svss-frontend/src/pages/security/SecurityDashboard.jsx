import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import StatCard from '../../components/dashboard/StatCard'
import Badge from '../../components/shared/Badge'
import { PageSpinner } from '../../components/shared/Spinner'
import { getDashboardStatsApi, getRecentScansApi } from '../../api/dashboardApi'
import { timeAgo } from '../../utils/helpers'
import './SecurityDashboard.css'

export default function SecurityDashboard() {
  const [stats, setStats] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStatsApi(), getRecentScansApi()])
      .then(([s, r]) => { setStats(s); setScans(r) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title="Security Dashboard"><PageSpinner /></AppLayout>

  return (
    <AppLayout title="Security Dashboard">
      <div className="sec-dash">

        {/* ── Hero Scanner CTA ── */}
        <Link to="/security/scanner" className="scanner-cta" aria-label="Open QR Scanner">
          <div className="scanner-cta__pulse" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="scanner-cta__text">
            <p className="scanner-cta__title">Open QR Scanner</p>
            <p className="scanner-cta__sub">Scan visitor tickets at entry gates</p>
          </div>
          <svg className="scanner-cta__arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        {/* ── Stats ── */}
        <div className="sec-stats">
          <StatCard title="Today's Scans"  value={stats.todayScans}       variant="primary" />
          <StatCard title="Approved"       value={stats.approvedEntries}  variant="success" />
          <StatCard title="Rejected"       value={stats.rejectedEntries}  variant="danger"  />
          <StatCard title="Open Incidents" value={stats.openIncidents}    variant="warning" />
        </div>

        {/* ── Scan Feed ── */}
        <section aria-labelledby="feed-title">
          <p className="sec-section-title">Recent Activity</p>
          <div className="scan-feed">
            <div className="scan-feed__head">
              <span className="scan-feed__title">Entry Log</span>
              <Badge variant="success" className="badge--live">Live</Badge>
            </div>
            {scans.map(s => (
              <div key={s.id} className="scan-feed-row">
                <div className={`scan-feed-icon scan-feed-icon--${s.result === 'approved' ? 'ok' : 'bad'}`} aria-hidden="true">
                  {s.result === 'approved'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--neon-red)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </div>
                <div>
                  <p className="scan-feed-name">{s.visitorName}</p>
                  <p className="scan-feed-meta">{s.ticketId}</p>
                </div>
                <Badge variant={s.result === 'approved' ? 'success' : 'danger'} style={{ marginLeft: 'auto', marginRight: 8 }}>
                  {s.result}
                </Badge>
                <span className="scan-feed-time">{timeAgo(s.time)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick links ── */}
        <div className="sec-links">
          <Link to="/security/verify" className="sec-link">
            <div className="sec-link__icon" style={{ background: 'rgba(16,185,129,.15)' }}>✅</div>
            <div>
              <p className="sec-link__label">Manual Verification</p>
              <p className="sec-link__sublabel">Review scanned ticket details</p>
            </div>
          </Link>
          <Link to="/security/incidents" className="sec-link">
            <div className="sec-link__icon" style={{ background: 'rgba(239,68,68,.15)' }}>⚠️</div>
            <div>
              <p className="sec-link__label">Report Incident</p>
              <p className="sec-link__sublabel">File a security report</p>
            </div>
          </Link>
        </div>

      </div>
    </AppLayout>
  )
}
