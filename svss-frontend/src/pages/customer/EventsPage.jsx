import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import Spinner from '../../components/shared/Spinner'
import Input from '../../components/shared/Input'
import { getEventsApi } from '../../api/customerApi'
import { formatDate } from '../../utils/helpers'
import './EventsPage.css'

const CATEGORIES = ['All', 'Concert', 'Expo', 'Conference', 'Festival']

export default function EventsPage() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')

  const load = (s = search, c = category) => {
    setLoading(true)
    getEventsApi(s, c === 'All' ? '' : c)
      .then(setEvents)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    setSearch(e.target.value)
    load(e.target.value, category)
  }

  const handleCategory = (cat) => {
    const next = cat === 'All' ? '' : cat
    setCategory(next)
    load(search, next)
  }

  return (
    <AppLayout title="Browse Events">
      <div className="events-page">

        {/* Header */}
        <div className="events-header">
          <div>
            <h1 className="events-title">Upcoming Events</h1>
            <p className="events-sub">Discover and purchase tickets for events near you.</p>
          </div>
          <div className="events-search">
            <Input
              id="event-search"
              placeholder="Search events, venues…"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="events-filters" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`events-filter-btn ${(category || 'All') === cat ? 'events-filter-btn--active' : ''}`}
              onClick={() => handleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="events-loading"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className="events-empty">
            <p>🔍</p>
            <p>No events found matching your search.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  )
}

function EventCard({ event }) {
  const minPrice = Math.min(...event.zones.map((z) => z.price))
  const totalAvailable = event.zones.reduce((s, z) => s + z.available, 0)

  return (
    <Link to={`/customer/events/${event.id}`} className="event-card">
      <div className="event-card__img-wrap">
        <img src={event.image} alt={event.name} className="event-card__img" loading="lazy" />
        <span className="event-card__category">{event.category}</span>
        {totalAvailable < 30 && totalAvailable > 0 && (
          <span className="event-card__tag event-card__tag--low">Few left!</span>
        )}
        {totalAvailable === 0 && (
          <span className="event-card__tag event-card__tag--sold">Sold out</span>
        )}
      </div>
      <div className="event-card__body">
        <h3 className="event-card__name">{event.name}</h3>
        <p className="event-card__venue">📍 {event.venue}</p>
        <div className="event-card__row">
          <span className="event-card__date">📅 {formatDate(event.date)} · {event.time}</span>
        </div>
        <p className="event-card__desc">{event.description}</p>
        <div className="event-card__footer">
          <span className="event-card__price">From ${minPrice}</span>
          {totalAvailable > 0
            ? <span className="event-card__avail">{totalAvailable} spots left</span>
            : <span className="event-card__avail event-card__avail--sold">Sold out</span>
          }
        </div>
      </div>
    </Link>
  )
}
