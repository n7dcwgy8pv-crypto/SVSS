import { MOCK_EVENTS, MOCK_CUSTOMER_TICKETS, MOCK_TICKETS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// In-memory store for customer-purchased tickets (merges with shared ticket pool)
let _customerTickets = [...MOCK_CUSTOMER_TICKETS]

// ── Events ────────────────────────────────────────────
export const getEventsApi = async (search = '', category = '') => {
  await delay(400)
  let result = [...MOCK_EVENTS]
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    )
  }
  if (category) {
    result = result.filter((e) => e.category === category)
  }
  return result
}

export const getEventByIdApi = async (id) => {
  await delay(300)
  const event = MOCK_EVENTS.find((e) => e.id === id)
  if (!event) throw new Error(`Event ${id} not found.`)
  return event
}

// ── Customer tickets ───────────────────────────────────
export const getMyTicketsApi = async (userId) => {
  await delay(400)
  return _customerTickets.filter((t) => t.ownerId === userId)
}

export const purchaseTicketApi = async ({ userId, userName, userEmail, eventId, zone, photoUrl }) => {
  await delay(800)

  const event = MOCK_EVENTS.find((e) => e.id === eventId)
  if (!event) throw new Error('Event not found.')

  const zoneInfo = event.zones.find((z) => z.name === zone)
  if (!zoneInfo) throw new Error('Selected zone not found.')
  if (zoneInfo.available <= 0) throw new Error('Sorry, this zone is sold out.')

  // Generate seat number
  const seatNum = Math.floor(Math.random() * 200) + 1
  const seatLetter = 'ABCDEFGH'[Math.floor(Math.random() * 8)]
  const seat = `AUTO-${zone.charAt(0)}${seatNum}${seatLetter}`

  const ticketId = `TKT-C${String(_customerTickets.length + 1).padStart(3, '0')}`

  const newTicket = {
    id: ticketId,
    ownerId: userId,
    ownerName: userName,
    ownerEmail: userEmail,
    eventId,
    event: event.name,
    eventDate: event.date,
    venue: event.venue,
    zone,
    seat,
    price: zoneInfo.price,
    status: 'valid',
    usedAt: null,
    qrData: `${ticketId}|${userName}|${event.name}|${zone}|${seat}`,
    photoUrl: photoUrl || null,
    purchasedAt: new Date().toISOString(),
    visitorName: userName,
    visitorEmail: userEmail,
    createdAt: new Date().toISOString().split('T')[0],
  }

  _customerTickets = [newTicket, ..._customerTickets]

  // Also push into the shared ticket pool so security can verify it
  MOCK_TICKETS.push(newTicket)

  // Decrement available count (mutate in-memory)
  zoneInfo.available = Math.max(0, zoneInfo.available - 1)

  return newTicket
}
