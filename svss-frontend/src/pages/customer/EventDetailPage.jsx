import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Spinner from '../../components/shared/Spinner'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay'
import { getEventByIdApi, purchaseTicketApi } from '../../api/customerApi'
import { fileToBase64, validateImageFile, formatDate } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'
import './EventDetailPage.css'

export default function EventDetailPage() {
  const { eventId } = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuthStore()

  const [event, setEvent]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError]     = useState('')
  const [apiError, setApiError]         = useState('')
  const [purchasedTicket, setPurchasedTicket] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { visitorName: user?.name || '', visitorEmail: user?.email || '' },
  })

  useEffect(() => {
    getEventByIdApi(eventId)
      .then((e) => { setEvent(e); setSelectedZone(e.zones[0]) })
      .catch(() => navigate('/customer/events', { replace: true }))
      .finally(() => setLoading(false))
  }, [eventId, navigate])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setPhotoError(err); return }
    setPhotoError('')
    setPhotoPreview(await fileToBase64(file))
  }

  const onSubmit = async (data) => {
    if (!photoPreview) { setPhotoError('Please upload your photo for identity verification.'); return }
    if (!selectedZone) { setApiError('Please select a zone.'); return }
    if (selectedZone.available <= 0) { setApiError('This zone is sold out. Please choose another.'); return }

    setApiError('')
    setPurchasing(true)
    try {
      const ticket = await purchaseTicketApi({
        userId:     user.id,
        userName:   data.visitorName,
        userEmail:  data.visitorEmail,
        eventId:    event.id,
        zone:       selectedZone.name,
        photoUrl:   photoPreview,
      })
      setPurchasedTicket(ticket)
      toast.success(`Ticket ${ticket.id} purchased successfully! 🎉`, { duration: 4000 })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Event Details">
        <div className="evtd-loading"><Spinner /></div>
      </AppLayout>
    )
  }

  /* ── Success screen ── */
  if (purchasedTicket) {
    return (
      <AppLayout title="Ticket Confirmed">
        <div className="evtd-success">
          <div className="evtd-success__icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Ticket Confirmed!</h2>
          <p>Your ticket <strong>{purchasedTicket.id}</strong> for <strong>{purchasedTicket.event}</strong> is ready.</p>
          <div className="evtd-success__details">
            <div className="evtd-success__detail-row">
              <span>Zone</span><strong>{purchasedTicket.zone}</strong>
            </div>
            <div className="evtd-success__detail-row">
              <span>Seat</span><strong>{purchasedTicket.seat}</strong>
            </div>
            <div className="evtd-success__detail-row">
              <span>Date</span><strong>{formatDate(purchasedTicket.eventDate)}</strong>
            </div>
            <div className="evtd-success__detail-row">
              <span>Amount Paid</span><strong>${purchasedTicket.price}</strong>
            </div>
          </div>
          <p className="evtd-success__qr-label">Present this QR code at the gate</p>
          <QRCodeDisplay value={purchasedTicket.qrData} size={220} />
          <div className="evtd-success__actions">
            <Button onClick={() => navigate('/customer/tickets')}>View My Tickets</Button>
            <Button variant="secondary" onClick={() => navigate('/customer/events')}>Browse More Events</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={event.name}>
      <div className="evtd-page">

        {/* Event info */}
        <div className="evtd-info">
          <div className="evtd-info__img-wrap">
            <img src={event.image} alt={event.name} className="evtd-info__img" />
            <span className="evtd-info__category">{event.category}</span>
          </div>
          <div className="evtd-info__body">
            <h1 className="evtd-info__name">{event.name}</h1>
            <p className="evtd-info__meta">📍 {event.venue}</p>
            <p className="evtd-info__meta">📅 {formatDate(event.date)} at {event.time}</p>
            <p className="evtd-info__desc">{event.description}</p>

            {/* Zone picker */}
            <div className="evtd-zones">
              <p className="evtd-zones__label">Select Zone</p>
              <div className="evtd-zones__grid">
                {event.zones.map((zone) => (
                  <button
                    key={zone.name}
                    type="button"
                    disabled={zone.available === 0}
                    className={`evtd-zone-btn ${selectedZone?.name === zone.name ? 'evtd-zone-btn--active' : ''} ${zone.available === 0 ? 'evtd-zone-btn--sold' : ''}`}
                    onClick={() => setSelectedZone(zone)}
                  >
                    <span className="evtd-zone-btn__name">{zone.name}</span>
                    <span className="evtd-zone-btn__price">${zone.price}</span>
                    <span className="evtd-zone-btn__avail">
                      {zone.available > 0 ? `${zone.available} left` : 'Sold out'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase form */}
        <div className="evtd-form-card">
          <div className="evtd-form-card__head">
            <h2 className="evtd-form-card__title">Complete Purchase</h2>
            {selectedZone && (
              <div className="evtd-form-card__summary">
                <span>{selectedZone.name} Zone</span>
                <span className="evtd-form-card__total">${selectedZone.price}</span>
              </div>
            )}
          </div>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="evtd-form-grid">
              <div className="field">
                <label className="field__label" htmlFor="visitorName">
                  Full Name <span className="field__required" aria-hidden="true"> *</span>
                </label>
                <input
                  id="visitorName"
                  className={`field__input ${errors.visitorName ? 'field__input--error' : ''}`}
                  placeholder="Your full name"
                  {...register('visitorName', { required: 'Full name is required.' })}
                />
                {errors.visitorName && (
                  <p className="field__error" role="alert">{errors.visitorName.message}</p>
                )}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="visitorEmail">
                  Email <span className="field__required" aria-hidden="true"> *</span>
                </label>
                <input
                  id="visitorEmail"
                  type="email"
                  className={`field__input ${errors.visitorEmail ? 'field__input--error' : ''}`}
                  placeholder="your@email.com"
                  {...register('visitorEmail', {
                    required: 'Email is required.',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email.' },
                  })}
                />
                {errors.visitorEmail && (
                  <p className="field__error" role="alert">{errors.visitorEmail.message}</p>
                )}
              </div>
            </div>

            {/* Photo upload — needed for identity verification at gate */}
            <div className="evtd-photo-section">
              <p className="evtd-photo-section__label">
                Identity Photo
                <span className="evtd-photo-section__hint">
                  Required for gate verification
                </span>
              </p>
              <label htmlFor="purchase-photo" className="evtd-photo-label">
                {photoPreview
                  ? <img src={photoPreview} alt="Your photo preview" className="evtd-photo-preview" />
                  : (
                    <div className="evtd-photo-placeholder">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <p>Upload your photo</p>
                      <p className="evtd-photo-hint">JPG · PNG · WebP · max 5 MB</p>
                    </div>
                  )
                }
                <input
                  id="purchase-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
              {photoPreview && (
                <button type="button" className="evtd-photo-remove" onClick={() => setPhotoPreview(null)}>
                  Remove photo
                </button>
              )}
              {photoError && <p className="field__error" role="alert">{photoError}</p>}
            </div>

            <div className="evtd-form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate('/customer/events')}>
                Cancel
              </Button>
              <Button type="submit" loading={purchasing} disabled={!selectedZone || selectedZone.available === 0}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
                  <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
                {selectedZone
                  ? `Purchase — $${selectedZone.price}`
                  : 'Select a Zone'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </AppLayout>
  )
}
