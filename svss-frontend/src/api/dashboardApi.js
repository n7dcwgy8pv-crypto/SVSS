import { MOCK_STATS, MOCK_RECENT_SCANS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export const getDashboardStatsApi = async () => {
  await delay(500)
  return MOCK_STATS
}

export const getRecentScansApi = async () => {
  await delay(300)
  return MOCK_RECENT_SCANS
}
