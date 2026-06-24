import { useEffect, useState } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import StatCard from '../../components/dashboard/StatCard'
import { PageSpinner } from '../../components/shared/Spinner'
import { getDashboardStatsApi } from '../../api/dashboardApi'
import { getTicketsApi } from '../../api/ticketApi'
import { getIncidentsApi } from '../../api/incidentApi'
import { ticketStatusLabel, incidentTypeLabel } from '../../utils/helpers'
import Badge from '../../components/shared/Badge'
import './ReportsPage.css'

export default function ReportsPage() {
  const [stats, setStats]       = useState(null)
  const [tickets, setTickets]   = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStatsApi(), getTicketsApi(), getIncidentsApi()])
      .then(([s, t, i]) => { setStats(s); setTickets(t); setIncidents(i) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title="Reports"><PageSpinner label="Compiling reports…" /></AppLayout>

  const ticketsByStatus = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1; return acc
  }, {})

  const incidentsByType = incidents.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1; return acc
  }, {})

  return (
    <AppLayout title="Reports">
      <div className="reports-page">

        {/* Entry Report */}
        <section aria-labelledby="entry-report">
          <h2 id="entry-report" className="report-section-title">Entry Report</h2>
          <div className="report-stats">
            <StatCard title="Total Scans"   value={stats.totalEntries}    variant="primary" />
            <StatCard title="Approved"      value={stats.approvedEntries} variant="success" />
            <StatCard title="Rejected"      value={stats.rejectedEntries} variant="danger"  />
            <StatCard title="Today's Scans" value={stats.todayScans}      variant="primary" />
          </div>
        </section>

        {/* Ticket Report */}
        <section aria-labelledby="ticket-report">
          <h2 id="ticket-report" className="report-section-title">Ticket Report</h2>
          <div className="report-stats">
            <StatCard title="Total Tickets" value={stats.totalTickets}   variant="primary" />
            <StatCard title="Valid"         value={stats.validTickets}   variant="success" />
            <StatCard title="Used"          value={stats.usedTickets}    variant="warning" />
            <StatCard title="Invalid"       value={stats.invalidTickets} variant="danger"  />
          </div>
          <div className="report-breakdown">
            <p className="report-breakdown-title">Ticket Status Breakdown</p>
            <div className="report-bars">
              {Object.entries(ticketsByStatus).map(([status, count]) => {
                const { label, color } = ticketStatusLabel(status)
                const pct = Math.round((count / tickets.length) * 100)
                return (
                  <div key={status} className="report-bar-row">
                    <span className="report-bar-label">
                      <Badge variant={color}>{label}</Badge>
                    </span>
                    <div className="report-bar-track"
                      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`${label}: ${pct}%`}>
                      <div className={`report-bar-fill report-bar-fill--${color}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="report-bar-count">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Incident Report */}
        <section aria-labelledby="incident-report">
          <h2 id="incident-report" className="report-section-title">Incident Report</h2>
          <div className="report-stats" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 480 }}>
            <StatCard title="Total Incidents" value={stats.totalIncidents} variant="warning" />
            <StatCard title="Open"            value={stats.openIncidents}  variant="danger"  />
          </div>
          <div className="report-breakdown">
            <p className="report-breakdown-title">Incidents by Type</p>
            <div className="report-type-grid">
              {Object.entries(incidentsByType).map(([type, count]) => (
                <div key={type} className="report-type-card">
                  <p className="report-type-count">{count}</p>
                  <p className="report-type-label">{incidentTypeLabel(type)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  )
}
