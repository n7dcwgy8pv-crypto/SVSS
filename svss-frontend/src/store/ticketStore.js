import { create } from 'zustand'

const useTicketStore = create((set) => ({
  tickets: [],
  currentTicket: null,
  searchQuery: '',
  creationStatus: 'idle', // idle | loading | success | error

  setTickets: (tickets) => set({ tickets }),
  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCreationStatus: (status) => set({ creationStatus: status }),

  addTicket: (ticket) =>
    set((state) => ({ tickets: [ticket, ...state.tickets] })),

  updateTicket: (id, updates) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  clearCurrentTicket: () => set({ currentTicket: null }),
}))

export default useTicketStore
