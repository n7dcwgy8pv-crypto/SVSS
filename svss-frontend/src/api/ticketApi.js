import apiClient from './apiClient'

// ── Ticket list & single fetch ────────────────────────────────────────────────

export const getTicketsApi = async (search = '') => {
  const params = {}
  if (search) params.search = search
  const res = await apiClient.get('/tickets', { params })
  // res.data = { success: true, data: Ticket[], pagination: ... }
  return res.data.data
}

export const getTicketByIdApi = async (id) => {
  const res = await apiClient.get(`/tickets/${id}`)
  return res.data.data
}

// ── Create ticket (admin) — multipart/form-data ───────────────────────────────
// Receives the raw File object for photo — do NOT convert to base64 first.
// Axios sets Content-Type multipart/form-data automatically when given FormData.

export const createTicketApi = async (data) => {
  const form = new FormData()
  form.append('visitorName', data.visitorName)
  form.append('visitorEmail', data.visitorEmail)
  form.append('event', data.event)
  form.append('eventDate', data.eventDate)
  form.append('zone', data.zone)
  form.append('seat', data.seat)
  form.append('photo', data.photo)

  // Delete Content-Type so Axios sets multipart/form-data with the correct boundary automatically.
  // If Content-Type: application/json leaks through (from the apiClient default), multer
  // on the backend will not parse the file and will return it as an empty object.
  const res = await apiClient.post('/tickets', form, {
    headers: { 'Content-Type': undefined },
  })
  return res.data.data
}

// ── Update ticket (admin) ─────────────────────────────────────────────────────

export const updateTicketApi = async (id, updates) => {
  const res = await apiClient.put(`/tickets/${id}`, updates)
  return res.data.data
}

// ── QR Verification (security) ────────────────────────────────────────────────

export const verifyTicketQRApi = async (qrData) => {
  const res = await apiClient.post('/tickets/verify', { qrData })
  // Server always returns 200 — check res.data.data.valid for the business result
  return res.data.data
  // Shape: { valid: boolean, reason: string | null, ticket: Ticket | null }
}

export const approveEntryApi = async (ticketId) => {
  const res = await apiClient.post(`/tickets/${ticketId}/approve`)
  return res.data.data
  // Shape: { success: true, ticketId, usedAt }
}

export const rejectEntryApi = async (ticketId) => {
  const res = await apiClient.post(`/tickets/${ticketId}/reject`)
  return res.data.data
  // Shape: { success: true, ticketId }
}
