import apiClient from './apiClient'

// ── Users list (admin) ────────────────────────────────────────────────────────

export const getUsersApi = async (params = {}) => {
  const res = await apiClient.get('/users', { params })
  // res.data = { success: true, data: User[], pagination: ... }
  return res.data.data
}

// ── Create staff user (admin) — no password field sent from FE ────────────────
// Server auto-generates a temporary password and returns it once in the response.

export const createUserApi = async (data) => {
  const res = await apiClient.post('/users', {
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    role:      data.role,         // must be 'admin' or 'security'
  })
  // res.data.data = { user: User, temporaryPassword: string }
  return res.data.data
}

// ── Toggle user active/inactive (admin) ───────────────────────────────────────

export const toggleUserStatusApi = async (id) => {
  const res = await apiClient.patch(`/users/${id}/status`)
  return res.data.data
}
