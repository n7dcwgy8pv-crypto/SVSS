import apiClient from './apiClient'

// ── Admin event management ────────────────────────────────────────────────────

export const getAdminEventsApi = async (params = {}) => {
  const res = await apiClient.get('/admin/events', { params })
  // Server returns { success: true, data: [...] }
  return res.data.data
}

export const getAdminEventByIdApi = async (id) => {
  const res = await apiClient.get(`/admin/events/${id}`)
  return res.data.data
}

export const createEventApi = async (data) => {
  const res = await apiClient.post('/admin/events', data)
  return res.data.data
}

export const updateEventApi = async (id, data) => {
  const res = await apiClient.put(`/admin/events/${id}`, data)
  return res.data.data
}

export const deleteEventApi = async (id) => {
  const res = await apiClient.delete(`/admin/events/${id}`)
  return res.data.data
}
