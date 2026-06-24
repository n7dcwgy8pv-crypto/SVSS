import { MOCK_TICKETS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
let _tickets = [...MOCK_TICKETS]

export const getTicketsApi = async (search = '') => {
  await delay(400)
  if (!search) return _tickets
  const q = search.toLowerCase()
  return _tickets.filter(
    (t) =>
      t.visitorName.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.event.toLowerCase().includes(q)
  )
}

export const getTicketByIdApi = async (id) => {
  await delay(300)
  const ticket = _tickets.find((t) => t.id === id)
  if (!ticket) throw new Error(`Ticket ${id} not found.`)
  return ticket
}

export const createTicketApi = async (data) => {
  await delay(600)
  const id = `TKT-${String(_tickets.length + 1).padStart(3, '0')}`
  const newTicket = {
    id,
    ...data,
    status: 'valid',
    usedAt: null,
    qrData: `${id}|${data.visitorName}|${data.event}|${data.zone}|${data.seat}`,
    createdAt: new Date().toISOString().split('T')[0],
  }
  _tickets = [newTicket, ..._tickets]
  return newTicket
}

export const updateTicketApi = async (id, updates) => {
  await delay(400)
  const idx = _tickets.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error(`Ticket ${id} not found.`)
  _tickets[idx] = { ..._tickets[idx], ...updates }
  return _tickets[idx]
}

export const verifyTicketQRApi = async (qrData) => {
  await delay(500)
  const ticket = _tickets.find((t) => t.qrData === qrData || t.id === qrData)
  if (!ticket) return { valid: false, reason: 'Ticket not found in system.' }
  if (ticket.status === 'used')
    return { valid: false, reason: 'Ticket has already been used.', ticket }
  if (ticket.status === 'invalid')
    return { valid: false, reason: 'Ticket is marked invalid.', ticket }
  return { valid: true, ticket }
}

export const approveEntryApi = async (ticketId) => {
  await delay(400)
  const idx = _tickets.findIndex((t) => t.id === ticketId)
  if (idx !== -1) {
    _tickets[idx] = { ..._tickets[idx], status: 'used', usedAt: new Date().toISOString() }
  }
  return { success: true, usedAt: new Date().toISOString() }
}

export const rejectEntryApi = async (ticketId) => {
  await delay(300)
  return { success: true, ticketId }
}
