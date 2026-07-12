import apiClient from './apiClient'

// ── Incidents list ────────────────────────────────────────────────────────────

export const getIncidentsApi = async (filters = {}) => {
  const params = {}
  if (filters.type)     params.type     = filters.type
  if (filters.status)   params.status   = filters.status
  if (filters.search)   params.search   = filters.search
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo)   params.dateTo   = filters.dateTo
  if (filters.page)     params.page     = filters.page
  if (filters.pageSize) params.pageSize = filters.pageSize

  const res = await apiClient.get('/incidents', { params })
  // res.data = { success: true, data: Incident[], pagination: ... }
  return res.data.data
}

export const getIncidentByIdApi = async (id) => {
  const res = await apiClient.get(`/incidents/${id}`)
  return res.data.data
}

// ── Create incident (security) ────────────────────────────────────────────────

export const createIncidentApi = async (data) => {
  const payload = {
    type:        data.type,
    description: data.description,
  }
  // ticketId is optional — only include if provided
  if (data.ticketId) payload.ticketId = data.ticketId

  const res = await apiClient.post('/incidents', payload)
  return res.data.data
}

// ── Update incident status (admin) ────────────────────────────────────────────

export const updateIncidentStatusApi = async (id, status) => {
  const res = await apiClient.patch(`/incidents/${id}/status`, { status })
  return res.data.data
}
