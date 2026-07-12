import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import Spinner from '../../components/shared/Spinner'
import Badge from '../../components/shared/Badge'
import { getMyTicketsApi } from '../../api/customerApi'
import useAuthStore from '../../store/authStore'
import { formatDate, ticketStatusLabel } from '../../utils/helpers'
import './CustomerDashboard.css'

export default function CustomerDashboard() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTicketsApi(user.id)
      .then(setTickets)
      .finally(() => setLoading(false))
  }, [user.id])

  const valid   = tickets.filter((t) => t.status === 'valid').length
  const used    = tickets.filter((t) => t.status === 'used').length
  const total   = tickets.length

  return (
    <AppLayout title="My Dashboard">
      <div className="cust-dash">

        {/* Welcome banner */}
        <div className="cust-welcome">
          <div className="cust-welcome__text">
            <p className="cust-welcome__eyebrow">Welcome back 👋</p>
            <h1 className="cust-welcome__name">{user.name}</h1>
            <p className="cust-welcome__sub">
              Manage your event tickets and discover upcoming events below.
            </p>
          </div>
          <Link to="/customer/events" className="cust-welcome__cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Browse Events
          </Link>
        </div>

        {/* Stats */}
        <div className="cust-stats">
          <div className="cust-stat">
            <div className="cust-stat__icon" style={{ background: 'rgba(79,142,255,.15)', color: 'var(--neon-blue)' }}>
              🎫
            </div>
            <div>
              <p className="cust-stat__value">{total}</p>
              <p className="cust-stat__label">Total Tickets</p>
            </div>
          </div>
          <div className="cust-stat">
            <div className="cust-stat__icon" style={{ background: 'rgba(16,185,129,.15)', color: 'var(--neon-green)' }}>
              ✅
            </div>
            <div>
              <p className="cust-stat__value">{valid}</p>
              <p className="cust-stat__label">Active Tickets</p>
            </div>
          </div>
          <div className="cust-stat">
            <div className="cust-stat__icon" style={{ background: 'rgba(245,158,11,.15)', color: 'var(--neon-amber)' }}>
              🎟️
            </div>
            <div>
              <p className="cust-stat__value">{used}</p>
              <p className="cust-stat__label">Events Attended</p>
            </div>
          </div>
        </div>

        {/* Recent tickets */}
        <div className="cust-section">
          <div className="cust-section__head">
            <h2 className="cust-section__title">My Tickets</h2>
            <Link to="/customer/tickets" className="cust-section__link">View all →</Link>
          </div>

          {loading ? (
            <div className="cust-loading"><Spinner /></div>
          ) : tickets.length === 0 ? (
            <div className="cust-empty">
              <p>🎫</p>
              <p>No tickets yet.</p>
              <Link to="/customer/events" className="cust-empty__cta">Browse events to get started</Link>
            </div>
          ) : (
            <div className="cust-ticket-list">
              {tickets.slice(0, 4).map((t) => {
                const { label, color } = ticketStatusLabel(t.status)
                return (
                  <div key={t.id} className="cust-ticket-card">
                    <div className="cust-ticket-card__left">
                      <p className="cust-ticket-card__event">{t.event}</p>
                      <p className="cust-ticket-card__meta">
                        {t.venue} &middot; {formatDate(t.eventDate)}
                      </p>
                      <p className="cust-ticket-card__meta">
                        Zone: <strong>{t.zone}</strong> &middot; Seat: <strong>{t.seat}</strong>
                      </p>
                    </div>
                    <div className="cust-ticket-card__right">
                      <Badge color={color}>{label}</Badge>
                      <p className="cust-ticket-card__id">{t.id}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick action */}
        <div className="cust-quick">
          <Link to="/customer/events" className="cust-quick-card">
            <div className="cust-quick-card__icon" style={{ background: 'rgba(16,185,129,.15)' }}>🎪</div>
            <div>
              <p className="cust-quick-card__label">Browse Events</p>
              <p className="cust-quick-card__sub">Find and purchase tickets</p>
            </div>
          </Link>
          <Link to="/customer/tickets" className="cust-quick-card">
            <div className="cust-quick-card__icon" style={{ background: 'rgba(168,85,247,.15)' }}>🎫</div>
            <div>
              <p className="cust-quick-card__label">My Tickets</p>
              <p className="cust-quick-card__sub">View QR codes & details</p>
            </div>
          </Link>
        </div>

      </div>
    </AppLayout>
  )
}
