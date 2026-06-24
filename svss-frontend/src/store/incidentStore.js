import { create } from 'zustand'

const useIncidentStore = create((set) => ({
  incidents: [],
  submissionStatus: 'idle', // idle | loading | success | error
  filters: { type: '', dateFrom: '', dateTo: '', search: '' },

  setIncidents: (incidents) => set({ incidents }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  addIncident: (incident) =>
    set((state) => ({ incidents: [incident, ...state.incidents] })),

  resetFilters: () =>
    set({ filters: { type: '', dateFrom: '', dateTo: '', search: '' } }),
}))

export default useIncidentStore
