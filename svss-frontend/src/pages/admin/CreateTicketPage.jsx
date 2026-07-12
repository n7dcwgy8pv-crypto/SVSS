import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Input from '../../components/shared/Input'
import Select from '../../components/shared/Select'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay'
import { createTicketApi } from '../../api/ticketApi'
import { validateImageFile } from '../../utils/helpers'
import './CreateTicketPage.css'

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const [loading, setLoading]             = useState(false)
  // Keep both the File (for upload) and a preview URL (for display)
  const [photoFile, setPhotoFile]         = useState(null)
  const [photoPreview, setPhotoPreview]   = useState(null)
  const [photoError, setPhotoError]       = useState('')
  const [createdTicket, setCreatedTicket] = useState(null)
  const [apiError, setApiError]           = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setPhotoError(err); return }
    setPhotoError('')
    setPhotoFile(file)
    // Object URL for preview — revoked on unmount / next selection
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const onSubmit = async (data) => {
    if (!photoFile) { setPhotoError('Please upload a visitor photo.'); return }
    setApiError('')
    setLoading(true)
    try {
      // Pass the raw File — createTicketApi builds FormData internally
      const ticket = await createTicketApi({ ...data, photo: photoFile })
      setCreatedTicket(ticket)
      toast.success(`Ticket ${ticket.id} created!`, { icon: '🎫' })
      reset()
      handleRemovePhoto()
    } catch (err) {
      setApiError(err?.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (createdTicket) {
    return (
      <AppLayout title="Create Ticket">
        <div className="create-ticket-success">
          <div className="success-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Ticket Created!</h2>
          <p>
            <strong>{createdTicket.id}</strong> has been issued for{' '}
            <strong>{createdTicket.visitorName}</strong>.
          </p>
          <QRCodeDisplay value={createdTicket.qrData} size={200} />
          <p className="success-qr-label">Scan at entry gates</p>
          <div className="success-actions">
            <Button onClick={() => setCreatedTicket(null)}>Create Another</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/tickets')}>
              View All Tickets
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  /* ── Form ── */
  return (
    <AppLayout title="Create Ticket">
      <div className="create-ticket-page">
        <div className="create-ticket-form-card">
          <div>
            <h2 className="form-card-title">New Visitor Ticket</h2>
            <p className="form-card-sub">
              Fill in visitor details and upload a photo to generate a QR-code entry pass.
            </p>
          </div>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create ticket form">
            {/* Visitor info */}
            <div className="form-section">
              <p className="form-section-title">Visitor Information</p>
              <div className="form-grid">
                <Input id="visitorName" label="Full Name" placeholder="John Doe" required
                  error={errors.visitorName?.message}
                  {...register('visitorName', { required: 'Visitor name is required.' })} />
                <Input id="visitorEmail" label="Email Address" type="email"
                  placeholder="visitor@email.com" required
                  error={errors.visitorEmail?.message}
                  {...register('visitorEmail', {
                    required: 'Email is required.',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address.' },
                  })} />
              </div>
            </div>

            {/* Ticket info */}
            <div className="form-section" style={{ marginTop: 20 }}>
              <p className="form-section-title">Ticket Information</p>
              <div className="form-grid">
                <Input id="event" label="Event Name" placeholder="e.g. Rock Concert 2026" required
                  error={errors.event?.message}
                  {...register('event', { required: 'Event name is required.' })} />
                <Select id="zone" label="Zone" required error={errors.zone?.message}
                  {...register('zone', { required: 'Zone is required.' })}>
                  <option value="">— Select zone —</option>
                  <option value="VIP">⭐  VIP</option>
                  <option value="Premium">💎  Premium</option>
                  <option value="General">🎟️  General</option>
                  <option value="Standard">📋  Standard</option>
                </Select>
                <Input id="seat" label="Seat Number" placeholder="e.g. A12" required
                  error={errors.seat?.message}
                  {...register('seat', { required: 'Seat number is required.' })} />
                <Input id="eventDate" label="Event Date" type="date" required
                  error={errors.eventDate?.message}
                  {...register('eventDate', { required: 'Event date is required.' })} />
              </div>
            </div>

            {/* Photo upload */}
            <div className="form-section" style={{ marginTop: 20 }}>
              <p className="form-section-title">Visitor Photo</p>
              <div className="photo-upload-area">
                <label htmlFor="photo-upload" className="photo-upload-label">
                  {photoPreview
                    ? <img src={photoPreview} alt="Visitor preview" className="photo-preview" />
                    : (
                      <div className="photo-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                          stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <p>Click to upload photo</p>
                        <p className="photo-hint">JPG · PNG · WebP · max 5 MB</p>
                      </div>
                    )
                  }
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoChange}
                    aria-describedby={photoError ? 'photo-error' : undefined}
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={handleRemovePhoto}
                    aria-label="Remove photo"
                  >
                    Remove photo
                  </button>
                )}
                {photoError && (
                  <p id="photo-error" className="field__error" role="alert">{photoError}</p>
                )}
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 24 }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/tickets')}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                </svg>
                Generate QR Ticket
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
