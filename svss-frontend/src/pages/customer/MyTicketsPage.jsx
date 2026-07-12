import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import Spinner from '../../components/shared/Spinner'
import Badge from '../../components/shared/Badge'
import Modal from '../../components/shared/Modal'
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay'
import { getMyTicketsApi } from '../../api/customerApi'
import { formatDate, formatDateTime, ticketStatusLabel } from '../../utils/helpers'
import './MyTicketsPage.css'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)   // ticket shown in QR modal

  useEffect(() => {
    // No userId param — server scopes to the authenticated token automatically
    getMyTicketsApi()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="My Tickets">
      <div className="my-tickets-page">

        {/* Header */}
        <div className="my-tickets__header">
          <div>
            <h1 className="my-tickets__title">My Tickets</h1>
            <p className="my-tickets__sub">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} in your account
            </p>
          </div>
          <Link to="/customer/events" className="my-tickets__buy-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Buy More Tickets
          </Link>
        </div>

        {loading ? (
          <div className="my-tickets__loading"><Spinner /></div>
        ) : tickets.length === 0 ? (
          <div className="my-tickets__empty">
            <p>🎫</p>
            <p>You haven&apos;t purchased any tickets yet.</p>
            <Link to="/customer/events" className="my-tickets__empty-cta">
              Browse events →
            </Link>
          </div>
        ) : (
          <div className="my-tickets__list">
            {tickets.map((ticket) => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                onViewQR={() => setSelected(ticket)}
              />
            ))}
          </div>
        )}

      </div>

      {/* QR Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Entry QR Code"
        size="sm"
      >
        {selected && (
          <div className="qr-modal">
            <p className="qr-modal__event">{selected.event}</p>
            <p className="qr-modal__meta">
              {selected.venue} &middot; {formatDate(selected.eventDate)}
            </p>
            <div className="qr-modal__qr">
              <QRCodeDisplay value={selected.qrData} size={240} />
            </div>
            <p className="qr-modal__hint">Present this code at the entry gate</p>
            <div className="qr-modal__details">
              <div className="qr-modal__row">
                <span>Ticket ID</span>
                <code>{selected.id}</code>
              </div>
              <div className="qr-modal__row">
                <span>Zone</span>
                <strong>{selected.zone}</strong>
              </div>
              <div className="qr-modal__row">
                <span>Seat</span>
                <strong>{selected.seat}</strong>
              </div>
              <div className="qr-modal__row">
                <span>Holder</span>
                <strong>{selected.visitorName}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}

function TicketItem({ ticket, onViewQR }) {
  const { label, color } = ticketStatusLabel(ticket.status)

  return (
    <div className={`ticket-item ${ticket.status === 'used' ? 'ticket-item--used' : ''}`}>
      {/* Left accent line */}
      <div className="ticket-item__accent" />

      <div className="ticket-item__body">
        <div className="ticket-item__top">
          <div>
            <h3 className="ticket-item__event">{ticket.event}</h3>
            <p className="ticket-item__meta">📍 {ticket.venue}</p>
            <p className="ticket-item__meta">📅 {formatDate(ticket.eventDate)} &middot; 🕐 {ticket.event.includes('Night') ? '20:00' : 'See event'}</p>
          </div>
          <Badge color={color}>{label}</Badge>
        </div>

        <div className="ticket-item__info">
          <div className="ticket-item__chip">
            <span className="ticket-item__chip-label">Zone</span>
            <span className="ticket-item__chip-val">{ticket.zone}</span>
          </div>
          <div className="ticket-item__chip">
            <span className="ticket-item__chip-label">Seat</span>
            <span className="ticket-item__chip-val">{ticket.seat}</span>
          </div>
          <div className="ticket-item__chip">
            <span className="ticket-item__chip-label">Paid</span>
            <span className="ticket-item__chip-val">${ticket.price}</span>
          </div>
          <div className="ticket-item__chip">
            <span className="ticket-item__chip-label">Purchased</span>
            <span className="ticket-item__chip-val">{formatDateTime(ticket.purchasedAt)}</span>
          </div>
        </div>
      </div>

      <div className="ticket-item__actions">
        <span className="ticket-item__id">{ticket.id}</span>
        {ticket.status === 'valid' ? (
          <button className="ticket-item__qr-btn" onClick={onViewQR} aria-label={`View QR code for ${ticket.id}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Show QR
          </button>
        ) : (
          <span className="ticket-item__used-label">
            {ticket.status === 'used' ? `Used ${formatDate(ticket.usedAt)}` : 'Invalid'}
          </span>
        )}
      </div>
    </div>
  )
}
