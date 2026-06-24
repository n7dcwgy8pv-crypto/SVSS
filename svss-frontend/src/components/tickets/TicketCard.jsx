import Badge from '../shared/Badge'
import { ticketStatusLabel, formatDate } from '../../utils/helpers'
import './TicketCard.css'

export default function TicketCard({ ticket, onClick }) {
  const { label, color } = ticketStatusLabel(ticket.status)
  return (
    <article
      className="ticket-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`Ticket ${ticket.id} for ${ticket.visitorName}`}
    >
      <div className="ticket-card__photo">
        {ticket.photoUrl
          ? <img src={ticket.photoUrl} alt={`${ticket.visitorName} photo`} />
          : <span className="ticket-card__no-photo" aria-label="No photo available">?</span>
        }
      </div>
      <div className="ticket-card__info">
        <p className="ticket-card__id">{ticket.id}</p>
        <p className="ticket-card__name">{ticket.visitorName}</p>
        <p className="ticket-card__event">{ticket.event}</p>
        <p className="ticket-card__meta">{ticket.zone} · Seat {ticket.seat}</p>
        <p className="ticket-card__date">Created {formatDate(ticket.createdAt)}</p>
      </div>
      <div className="ticket-card__status">
        <Badge variant={color}>{label}</Badge>
      </div>
    </article>
  )
}
