import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Input from '../../components/shared/Input'
import Select from '../../components/shared/Select'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import { PageSpinner } from '../../components/shared/Spinner'
import { createEventApi, updateEventApi, getAdminEventByIdApi } from '../../api/eventAdminApi'
import { getErrorMessage } from '../../utils/apiError'
import './CreateEventPage.css'

const ZONE_NAMES = ['VIP', 'Premium', 'General', 'Standard']
const DEFAULT_ZONES = [
  { name: 'VIP',     price: 250, available: 50  },
  { name: 'General', price: 80,  available: 200 },
]

export default function CreateEventPage() {
  const navigate      = useNavigate()
  const { eventId }   = useParams()           // present when editing
  const isEdit        = Boolean(eventId)

  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name:        '',
      venue:       '',
      date:        '',
      time:        '',
      category:    '',
      image:       '',
      description: '',
      zones:       DEFAULT_ZONES,
    },
  })

  // Dynamic zones array
  const { fields, append, remove } = useFieldArray({ control, name: 'zones' })

  useEffect(() => {
    if (!isEdit) return
    setFetching(true)
    getAdminEventByIdApi(eventId)
      .then((ev) => {
        reset({
          name:        ev.name,
          venue:       ev.venue,
          date:        ev.date,
          time:        ev.time,
          category:    ev.category,
          image:       ev.image || '',
          description: ev.description || '',
          zones:       ev.zones?.length ? ev.zones : DEFAULT_ZONES,
        })
      })
      .catch((err) => { toast.error(getErrorMessage(err)); navigate('/admin/events') })
      .finally(() => setFetching(false))
  }, [eventId, isEdit, navigate, reset])

  const onSubmit = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      // Convert price and available to numbers
      const payload = {
        ...data,
        image: data.image || null,
        description: data.description || null,
        zones: data.zones.map((z) => ({
          name:      z.name,
          price:     Number(z.price),
          available: Number(z.available),
        })),
      }

      if (isEdit) {
        await updateEventApi(eventId, payload)
        toast.success('Event updated successfully!')
      } else {
        await createEventApi(payload)
        toast.success('Event created! Customers can now browse and purchase tickets.')
      }
      navigate('/admin/events')
    } catch (err) {
      setApiError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <AppLayout title={isEdit ? 'Edit Event' : 'Create Event'}><PageSpinner label="Loading event…" /></AppLayout>
  }

  return (
    <AppLayout title={isEdit ? 'Edit Event' : 'Create Event'}>
      <div className="create-event-page">
        <div className="create-event-card">

          <div className="create-event-card__head">
            <h2 className="create-event-card__title">
              {isEdit ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="create-event-card__sub">
              {isEdit
                ? 'Update event details and zone availability.'
                : 'Fill in the details below. Customers will see this event and can purchase tickets.'}
            </p>
          </div>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Event form">

            {/* ── Basic info ── */}
            <div className="form-section">
              <p className="form-section-title">Event Details</p>
              <div className="form-grid-2">
                <Input
                  id="ev-name"
                  label="Event Name"
                  placeholder="e.g. Rock Concert 2026"
                  required
                  error={errors.name?.message}
                  {...register('name', { required: 'Event name is required.' })}
                />
                <Select
                  id="ev-category"
                  label="Category"
                  required
                  error={errors.category?.message}
                  {...register('category', { required: 'Category is required.' })}
                >
                  <option value="">— Select category —</option>
                  <option value="Concert">🎵  Concert</option>
                  <option value="Expo">🏛️  Expo</option>
                  <option value="Conference">🎤  Conference</option>
                  <option value="Festival">🎉  Festival</option>
                </Select>
              </div>

              <Input
                id="ev-venue"
                label="Venue"
                placeholder="e.g. Grand Arena, Downtown"
                required
                error={errors.venue?.message}
                {...register('venue', { required: 'Venue is required.' })}
              />

              <div className="form-grid-2">
                <Input
                  id="ev-date"
                  label="Event Date"
                  type="date"
                  required
                  error={errors.date?.message}
                  {...register('date', { required: 'Date is required.' })}
                />
                <Input
                  id="ev-time"
                  label="Start Time"
                  type="time"
                  required
                  error={errors.time?.message}
                  {...register('time', { required: 'Start time is required.' })}
                />
              </div>

              <Input
                id="ev-image"
                label="Cover Image URL (optional)"
                placeholder="https://example.com/image.jpg"
                error={errors.image?.message}
                {...register('image')}
              />

              <div className="field">
                <label className="field__label" htmlFor="ev-desc">Description (optional)</label>
                <textarea
                  id="ev-desc"
                  className="field__input field__textarea"
                  rows={3}
                  placeholder="Describe the event for customers…"
                  {...register('description')}
                />
              </div>
            </div>

            {/* ── Zones / pricing ── */}
            <div className="form-section" style={{ marginTop: 24 }}>
              <div className="form-section-header">
                <p className="form-section-title">Ticket Zones &amp; Pricing</p>
                <button
                  type="button"
                  className="zone-add-btn"
                  onClick={() => append({ name: 'General', price: 50, available: 100 })}
                  disabled={fields.length >= 4}
                >
                  + Add Zone
                </button>
              </div>
              <p className="form-section-hint">
                Define the zones customers can choose from. Price and available seats are set per zone.
              </p>

              <div className="zones-list">
                {fields.map((field, index) => (
                  <div key={field.id} className="zone-row">
                    <div className="zone-row__name">
                      <label className="field__label" htmlFor={`zone-name-${index}`}>Zone</label>
                      <select
                        id={`zone-name-${index}`}
                        className="field__input"
                        {...register(`zones.${index}.name`, { required: true })}
                      >
                        {ZONE_NAMES.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div className="zone-row__price">
                      <label className="field__label" htmlFor={`zone-price-${index}`}>Price ($)</label>
                      <input
                        id={`zone-price-${index}`}
                        type="number"
                        min="0"
                        className={`field__input ${errors.zones?.[index]?.price ? 'field__input--error' : ''}`}
                        {...register(`zones.${index}.price`, {
                          required: true,
                          min: { value: 0, message: 'Min 0' },
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="zone-row__seats">
                      <label className="field__label" htmlFor={`zone-avail-${index}`}>Seats</label>
                      <input
                        id={`zone-avail-${index}`}
                        type="number"
                        min="1"
                        className={`field__input ${errors.zones?.[index]?.available ? 'field__input--error' : ''}`}
                        {...register(`zones.${index}.available`, {
                          required: true,
                          min: { value: 1, message: 'Min 1' },
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      className="zone-row__remove"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      aria-label={`Remove zone ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {errors.zones && (
                <p className="field__error" role="alert">Please fill in all zone fields correctly.</p>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="form-actions" style={{ marginTop: 28 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/events')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
