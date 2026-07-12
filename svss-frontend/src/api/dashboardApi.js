import apiClient from './apiClient'

// ── Dashboard stats (admin + security) ───────────────────────────────────────

export const getDashboardStatsApi = async () => {
  const res = await apiClient.get('/dashboard/stats')
  return res.data.data
}

// ── Recent scan feed (admin + security) ───────────────────────────────────────

export const getRecentScansApi = async (limit = 10) => {
  const res = await apiClient.get('/dashboard/scans', { params: { limit } })
  return res.data.data
}

// ── Reports (admin only) ──────────────────────────────────────────────────────

export const getTicketsReportApi = async (params = {}) => {
  const res = await apiClient.get('/reports/tickets', { params })
  // res.data.data = { summary, tickets, pagination }
  return res.data.data
}

export const getIncidentsReportApi = async (params = {}) => {
  const res = await apiClient.get('/reports/incidents', { params })
  // res.data.data = { summary, incidents }
  return res.data.data
}

export const getEntriesReportApi = async (params = {}) => {
  const res = await apiClient.get('/reports/entries', { params })
  // res.data.data = { summary, entries, pagination }
  return res.data.data
}
