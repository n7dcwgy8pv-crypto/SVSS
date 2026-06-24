import { MOCK_INCIDENTS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
let _incidents = [...MOCK_INCIDENTS]

export const getIncidentsApi = async (filters = {}) => {
  await delay(400)
  let result = [..._incidents]
  if (filters.type) result = result.filter((i) => i.type === filters.type)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.ticketId.toLowerCase().includes(q) ||
        i.reportedBy.toLowerCase().includes(q)
    )
  }
  return result
}

export const createIncidentApi = async (data) => {
  await delay(500)
  const id = `INC-${String(_incidents.length + 1).padStart(3, '0')}`
  const newIncident = {
    id,
    ...data,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  _incidents = [newIncident, ..._incidents]
  return newIncident
}

export const getIncidentByIdApi = async (id) => {
  await delay(300)
  const inc = _incidents.find((i) => i.id === id)
  if (!inc) throw new Error(`Incident ${id} not found.`)
  return inc
}
