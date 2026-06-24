import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import TicketCard from '../../components/tickets/TicketCard'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'
import Modal from '../../components/shared/Modal'
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay'
import Badge from '../../components/shared/Badge'
import { PageSpinner } from '../../components/shared/Spinner'
import PageHeader from '../../components/shared/PageHeader'
import { getTicketsApi } from '../../api/ticketApi'
import { ticketStatusLabel, formatDate, formatDateTime } from '../../utils/helpers'
import './TicketsPage.css'

export default function TicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  const loadTickets = async (q = '') => {
    setLoading(true)
    try { setTickets(await getTicketsApi(q)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTickets()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadTickets(search)
  }

  const { label: selLabel, color: selColor } = selectedTicket
    ? ticketStatusLabel(selectedTicket.status)
    : { label: '', color: '' }

  return (
    <AppLayout title="Ticket Management">
      <div className="tickets-page">

        <PageHeader
          eyebrow="Access Control"
          title="Ticket Management"
          subtitle="Search, view and manage all visitor entry tickets."
          action={
            <Button onClick={() => navigate('/admin/tickets/new')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Ticket
            </Button>
          }
        />

        {/* Search bar */}
        <div className="tickets-toolbar">
          <form onSubmit={handleSearch} className="tickets-search" role="search" aria-label="Search tickets">
            <Input
              id="ticket-search"
              placeholder="Search by visitor name, ticket ID, or event…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tickets"
            />
            <Button type="submit" variant="secondary">Search</Button>
            {search && (
              <Button type="button" variant="ghost" onClick={() => { setSearch(''); loadTickets('') }}>
                Clear
              </Button>
            )}
          </form>
          <Button onClick={() => navigate('/admin/tickets/new')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </Button>
        </div>
        {/* Count */}
        {!loading && (
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 500 }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} {search ? `matching "${search}"` : 'total'}
          </p>
        )}

        {loading && <PageSpinner label="Loading tickets…" />}

        {!loading && tickets.length === 0 && (
          <div className="tickets-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
            <p>No tickets found{search ? ` for "${search}"` : '.'}</p>
            <Button size="sm" onClick={() => navigate('/admin/tickets/new')}>Create First Ticket</Button>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="tickets-list" role="list" aria-label="Ticket list">
            {tickets.map((ticket) => (
              <div key={ticket.id} role="listitem">
                <TicketCard ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`${selectedTicket?.id} — Ticket Details`}
        size="lg"
      >
        {selectedTicket && (
          <div className="ticket-detail">
            <div className="ticket-detail__left">
              <div className="ticket-detail__photo">
                {selectedTicket.photoUrl
                  ? <img src={selectedTicket.photoUrl} alt={`Photo of ${selectedTicket.visitorName}`} />
                  : <span className="ticket-detail__no-photo">No Photo</span>
                }
              </div>
              <QRCodeDisplay value={selectedTicket.qrData} size={170} />
              <p style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', marginTop: -4 }}>
                Scan at entry gate
              </p>
            </div>
            <div className="ticket-detail__right">
              <dl className="ticket-detail__dl">
                <div><dt>Status</dt>    <dd><Badge variant={selColor}>{selLabel}</Badge></dd></div>
                <div><dt>Visitor</dt>   <dd>{selectedTicket.visitorName}</dd></div>
                <div><dt>Email</dt>     <dd>{selectedTicket.visitorEmail || '—'}</dd></div>
                <div><dt>Event</dt>     <dd>{selectedTicket.event}</dd></div>
                <div><dt>Zone</dt>      <dd>{selectedTicket.zone}</dd></div>
                <div><dt>Seat</dt>      <dd>{selectedTicket.seat}</dd></div>
                <div><dt>Created</dt>   <dd>{formatDate(selectedTicket.createdAt)}</dd></div>
                {selectedTicket.usedAt && (
                  <div><dt>Used At</dt><dd>{formatDateTime(selectedTicket.usedAt)}</dd></div>
                )}
              </dl>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
