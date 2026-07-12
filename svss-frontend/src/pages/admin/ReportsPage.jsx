import { useEffect, useState } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import StatCard from '../../components/dashboard/StatCard'
import { PageSpinner } from '../../components/shared/Spinner'
import {
  getDashboardStatsApi,
  getTicketsReportApi,
  getIncidentsReportApi,
} from '../../api/dashboardApi'
import { ticketStatusLabel, incidentTypeLabel } from '../../utils/helpers'
import { getErrorMessage } from '../../utils/apiError'
import Badge from '../../components/shared/Badge'
import toast from 'react-hot-toast'
import './ReportsPage.css'

export default function ReportsPage() {
  const [stats, setStats]         = useState(null)
  const [ticketReport, setTicketReport]     = useState(null)
  const [incidentReport, setIncidentReport] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStatsApi(),
      getTicketsReportApi(),
      getIncidentsReportApi(),
    ])
      .then(([s, tr, ir]) => {
        setStats(s)
        setTicketReport(tr)
        setIncidentReport(ir)
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title="Reports"><PageSpinner label="Compiling reports…" /></AppLayout>

  // Build breakdown from the ticket list returned by the report endpoint
  const tickets    = ticketReport?.tickets   ?? []
  const incidents  = incidentReport?.incidents ?? []

  const ticketsByStatus = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  const incidentsByType = incidents.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1
    return acc
  }, {})

  // Prefer summary counts from the report endpoints if available, fall back to dashboard stats
  const tSummary = ticketReport?.summary
  const iSummary = incidentReport?.summary

  return (
    <AppLayout title="Reports">
      <div className="reports-page">

        {/* ── Entry Report ── */}
        <section aria-labelledby="entry-report">
          <h2 id="entry-report" className="report-section-title">Entry Report</h2>
          <div className="report-stats">
            <StatCard title="Total Scans"   value={stats?.totalEntries    ?? 0} variant="primary" />
            <StatCard title="Approved"      value={stats?.approvedEntries ?? 0} variant="success" />
            <StatCard title="Rejected"      value={stats?.rejectedEntries ?? 0} variant="danger"  />
            <StatCard title="Today's Scans" value={stats?.todayScans      ?? 0} variant="primary" />
          </div>
        </section>

        {/* ── Ticket Report ── */}
        <section aria-labelledby="ticket-report">
          <h2 id="ticket-report" className="report-section-title">Ticket Report</h2>
          <div className="report-stats">
            <StatCard title="Total Tickets"
              value={tSummary?.totalTickets   ?? stats?.totalTickets   ?? 0} variant="primary" />
            <StatCard title="Valid"
              value={tSummary?.validTickets   ?? stats?.validTickets   ?? 0} variant="success" />
            <StatCard title="Used"
              value={tSummary?.usedTickets    ?? stats?.usedTickets    ?? 0} variant="warning" />
            <StatCard title="Invalid"
              value={tSummary?.invalidTickets ?? stats?.invalidTickets ?? 0} variant="danger"  />
          </div>

          {tickets.length > 0 && (
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
                      <div
                        className="report-bar-track"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label}: ${pct}%`}
                      >
                        <div
                          className={`report-bar-fill report-bar-fill--${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="report-bar-count">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Incident Report ── */}
        <section aria-labelledby="incident-report">
          <h2 id="incident-report" className="report-section-title">Incident Report</h2>
          <div className="report-stats" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 480 }}>
            <StatCard title="Total Incidents"
              value={iSummary?.total ?? stats?.totalIncidents ?? 0} variant="warning" />
            <StatCard title="Open"
              value={iSummary?.open  ?? stats?.openIncidents  ?? 0} variant="danger"  />
          </div>

          {incidents.length > 0 && (
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
          )}
        </section>

      </div>
    </AppLayout>
  )
}
