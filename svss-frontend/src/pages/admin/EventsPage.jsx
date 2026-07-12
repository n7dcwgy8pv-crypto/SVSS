import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Button from '../../components/shared/Button'
import Badge from '../../components/shared/Badge'
import Modal from '../../components/shared/Modal'
import { PageSpinner } from '../../components/shared/Spinner'
import { getAdminEventsApi, deleteEventApi } from '../../api/eventAdminApi'
import { getErrorMessage } from '../../utils/apiError'
import { formatDate } from '../../utils/helpers'
import './EventsPage.css'

export default function AdminEventsPage() {
  const navigate = useNavigate()
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)   // id being deleted
  const [confirmId, setConfirmId] = useState(null)   // id pending confirm

  const load = async () => {
    setLoading(true)
    try { setEvents(await getAdminEventsApi()) }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line

  const handleDelete = async () => {
    if (!confirmId) return
    setDeleting(confirmId)
    try {
      await deleteEventApi(confirmId)
      setEvents(prev => prev.filter(e => e.id !== confirmId))
      toast.success('Event deleted.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  const totalAvailable = (event) =>
    event.zones?.reduce((s, z) => s + (z.available ?? 0), 0) ?? 0

  return (
    <AppLayout title="Events">
      <div className="admin-events-page">

        {/* Header */}
        <div className="admin-events__header">
          <div>
            <h1 className="admin-events__title">Event Management</h1>
            <p className="admin-events__sub">
              Create and manage events that customers can browse and purchase tickets for.
            </p>
          </div>
          <Button onClick={() => navigate('/admin/events/new')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Event
          </Button>
        </div>

        {loading && <PageSpinner label="Loading events…" />}

        {!loading && events.length === 0 && (
          <div className="admin-events__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No events yet.</p>
            <Button size="sm" onClick={() => navigate('/admin/events/new')}>
              Create your first event
            </Button>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="admin-events__grid">
            {events.map((event) => (
              <div key={event.id} className="event-admin-card">
                {event.image && (
                  <div className="event-admin-card__img-wrap">
                    <img src={event.image} alt={event.name} className="event-admin-card__img" loading="lazy" />
                  </div>
                )}
                <div className="event-admin-card__body">
                  <div className="event-admin-card__top">
                    <Badge variant="info">{event.category}</Badge>
                    <span className="event-admin-card__date">{formatDate(event.date)} · {event.time}</span>
                  </div>
                  <h3 className="event-admin-card__name">{event.name}</h3>
                  <p className="event-admin-card__venue">📍 {event.venue}</p>

                  {/* Zone summary */}
                  <div className="event-admin-card__zones">
                    {event.zones?.map((z) => (
                      <span key={z.name} className="event-admin-card__zone-chip">
                        {z.name} · ${z.price} · <strong>{z.available}</strong> left
                      </span>
                    ))}
                  </div>

                  <div className="event-admin-card__footer">
                    <span className="event-admin-card__seats">
                      {totalAvailable(event)} total seats available
                    </span>
                    <div className="event-admin-card__actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmId(event.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete Event"
        size="sm"
      >
        <div className="confirm-modal">
          <p>Are you sure you want to delete this event? This cannot be undone.</p>
          <div className="confirm-modal__actions">
            <Button variant="secondary" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={!!deleting}
              onClick={handleDelete}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
