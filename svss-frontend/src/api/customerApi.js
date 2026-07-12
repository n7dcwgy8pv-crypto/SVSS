import apiClient from './apiClient'

// ── Events (customer) ─────────────────────────────────────────────────────────

export const getEventsApi = async (search = '', category = '') => {
  const params = {}
  if (search)   params.search   = search
  if (category) params.category = category

  const res = await apiClient.get('/events', { params })
  // res.data = { success: true, data: Event[], pagination: ... }
  return res.data.data
}

export const getEventByIdApi = async (id) => {
  const res = await apiClient.get(`/events/${id}`)
  return res.data.data
}

// ── Customer tickets ──────────────────────────────────────────────────────────

export const getMyTicketsApi = async (params = {}) => {
  const res = await apiClient.get('/customer/tickets', { params })
  return res.data.data
}

export const getMyTicketByIdApi = async (id) => {
  const res = await apiClient.get(`/customer/tickets/${id}`)
  return res.data.data
}

// ── Purchase ticket (customer) — multipart/form-data ─────────────────────────
// photo must be a raw File object — do NOT convert to base64 first.
// The backend expects multipart/form-data; Axios sets the boundary automatically.

export const purchaseTicketApi = async ({
  visitorName,
  visitorEmail,
  eventId,
  zone,
  photo,        // File object from <input type="file">
}) => {
  const form = new FormData()
  form.append('eventId',      eventId)
  form.append('zone',         zone)
  form.append('visitorName',  visitorName)
  form.append('visitorEmail', visitorEmail)
  form.append('photo',        photo)   // field name must be exactly 'photo'

  // Delete Content-Type so Axios sets multipart/form-data + boundary automatically.
  const res = await apiClient.post('/customer/tickets/purchase', form, {
    headers: { 'Content-Type': undefined },
  })
  return res.data.data
}
