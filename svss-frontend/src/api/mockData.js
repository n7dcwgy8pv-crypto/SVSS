// ============================================================
// Mock data — replace each function body with real API calls
// when a backend is available.
// ============================================================

export const MOCK_USERS = [
  { id: 'u1', name: 'Alice Admin',    email: 'admin@svss.io',    role: 'admin',    status: 'active',   createdAt: '2026-01-10' },
  { id: 'u2', name: 'Bob Security',   email: 'bob@svss.io',      role: 'security', status: 'active',   createdAt: '2026-01-15' },
  { id: 'u3', name: 'Carol Guard',    email: 'carol@svss.io',    role: 'security', status: 'active',   createdAt: '2026-02-01' },
  { id: 'u4', name: 'Dave Operator',  email: 'dave@svss.io',     role: 'security', status: 'inactive', createdAt: '2026-02-20' },
  { id: 'u5', name: 'Eva Customer',   email: 'eva@svss.io',      role: 'customer', status: 'active',   createdAt: '2026-03-01' },
]

// Events available for customers to purchase tickets
export const MOCK_EVENTS = [
  {
    id: 'EVT-001',
    name: 'Rock Concert 2026',
    venue: 'Grand Arena, Downtown',
    date: '2026-09-15',
    time: '19:00',
    category: 'Concert',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b4d8955?w=600&q=80',
    description: 'An electrifying night of rock music featuring top international bands.',
    zones: [
      { name: 'VIP',      price: 250, available: 20 },
      { name: 'Premium',  price: 150, available: 45 },
      { name: 'General',  price: 80,  available: 120 },
      { name: 'Standard', price: 50,  available: 200 },
    ],
  },
  {
    id: 'EVT-002',
    name: 'Gaming Expo 2026',
    venue: 'Tech Convention Center',
    date: '2026-10-05',
    time: '10:00',
    category: 'Expo',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    description: 'The largest gaming and esports expo of the year. Try the latest games before launch.',
    zones: [
      { name: 'VIP',      price: 180, available: 15 },
      { name: 'General',  price: 60,  available: 300 },
      { name: 'Standard', price: 35,  available: 500 },
    ],
  },
  {
    id: 'EVT-003',
    name: 'Tech Summit 2026',
    venue: 'Innovation Hub',
    date: '2026-11-20',
    time: '09:00',
    category: 'Conference',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80',
    description: 'Industry leaders share insights on AI, blockchain, and the future of technology.',
    zones: [
      { name: 'VIP',      price: 400, available: 10 },
      { name: 'Premium',  price: 220, available: 30 },
      { name: 'General',  price: 100, available: 80 },
    ],
  },
  {
    id: 'EVT-004',
    name: 'Jazz Night Under Stars',
    venue: 'Riverside Amphitheatre',
    date: '2026-08-30',
    time: '20:00',
    category: 'Concert',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
    description: 'A magical evening of smooth jazz under an open sky. Bring your blankets!',
    zones: [
      { name: 'Premium',  price: 120, available: 60 },
      { name: 'General',  price: 55,  available: 180 },
      { name: 'Standard', price: 30,  available: 250 },
    ],
  },
]

export const MOCK_TICKETS = [
  {
    id: 'TKT-001', visitorName: 'John Doe',     visitorEmail: 'john@email.com',
    event: 'Rock Concert 2026',  seat: 'A12',   zone: 'VIP',
    status: 'valid',   usedAt: null,
    qrData: 'TKT-001|John Doe|Rock Concert 2026|VIP|A12',
    photoUrl: 'https://i.pravatar.cc/150?img=1',
    createdAt: '2026-06-01',
  },
  {
    id: 'TKT-002', visitorName: 'Jane Smith',   visitorEmail: 'jane@email.com',
    event: 'Rock Concert 2026',  seat: 'B05',   zone: 'General',
    status: 'used',    usedAt: '2026-06-20T18:32:00',
    qrData: 'TKT-002|Jane Smith|Rock Concert 2026|General|B05',
    photoUrl: 'https://i.pravatar.cc/150?img=2',
    createdAt: '2026-06-02',
  },
  {
    id: 'TKT-003', visitorName: 'Mike Johnson', visitorEmail: 'mike@email.com',
    event: 'Gaming Expo 2026',   seat: 'C18',   zone: 'Standard',
    status: 'invalid', usedAt: null,
    qrData: 'TKT-003|Mike Johnson|Gaming Expo 2026|Standard|C18',
    photoUrl: null,
    createdAt: '2026-06-03',
  },
  {
    id: 'TKT-004', visitorName: 'Sara Lee',     visitorEmail: 'sara@email.com',
    event: 'Tech Summit 2026',   seat: 'D22',   zone: 'Premium',
    status: 'valid',   usedAt: null,
    qrData: 'TKT-004|Sara Lee|Tech Summit 2026|Premium|D22',
    photoUrl: 'https://i.pravatar.cc/150?img=5',
    createdAt: '2026-06-10',
  },
  {
    id: 'TKT-005', visitorName: 'Carlos Ruiz',  visitorEmail: 'carlos@email.com',
    event: 'Rock Concert 2026',  seat: 'A09',   zone: 'VIP',
    status: 'valid',   usedAt: null,
    qrData: 'TKT-005|Carlos Ruiz|Rock Concert 2026|VIP|A09',
    photoUrl: 'https://i.pravatar.cc/150?img=8',
    createdAt: '2026-06-12',
  },
]

export const MOCK_INCIDENTS = [
  {
    id: 'INC-001', type: 'duplicate',   ticketId: 'TKT-002',
    description: 'Ticket scanned a second time at Gate 3.',
    reportedBy: 'Bob Security', createdAt: '2026-06-20T18:35:00', status: 'open',
  },
  {
    id: 'INC-002', type: 'suspicious',  ticketId: 'TKT-003',
    description: 'Visitor appearance did not match registered photo.',
    reportedBy: 'Carol Guard',  createdAt: '2026-06-21T09:12:00', status: 'investigating',
  },
  {
    id: 'INC-003', type: 'invalid',     ticketId: 'TKT-003',
    description: 'QR code returned invalid ticket status.',
    reportedBy: 'Bob Security', createdAt: '2026-06-21T10:00:00', status: 'resolved',
  },
]

export const MOCK_STATS = {
  totalTickets: 512,
  usedTickets: 318,
  validTickets: 189,
  invalidTickets: 5,
  totalEntries: 318,
  approvedEntries: 305,
  rejectedEntries: 13,
  totalIncidents: 7,
  openIncidents: 3,
  todayScans: 42,
}

// Customer-owned ticket purchases (linked to a user)
export const MOCK_CUSTOMER_TICKETS = [
  {
    id: 'TKT-C001',
    ownerId: 'u5',
    ownerName: 'Eva Customer',
    ownerEmail: 'eva@svss.io',
    eventId: 'EVT-001',
    event: 'Rock Concert 2026',
    eventDate: '2026-09-15',
    venue: 'Grand Arena, Downtown',
    zone: 'General',
    seat: 'AUTO-G45',
    price: 80,
    status: 'valid',
    usedAt: null,
    qrData: 'TKT-C001|Eva Customer|Rock Concert 2026|General|AUTO-G45',
    photoUrl: 'https://i.pravatar.cc/150?img=9',
    purchasedAt: '2026-07-01T10:30:00',
    visitorName: 'Eva Customer',
    visitorEmail: 'eva@svss.io',
    createdAt: '2026-07-01',
  },
]

export const MOCK_RECENT_SCANS = [
  { id: 's1', ticketId: 'TKT-001', visitorName: 'John Doe',    result: 'approved', time: '2026-06-23T08:10:00' },
  { id: 's2', ticketId: 'TKT-002', visitorName: 'Jane Smith',  result: 'rejected', time: '2026-06-23T08:22:00' },
  { id: 's3', ticketId: 'TKT-005', visitorName: 'Carlos Ruiz', result: 'approved', time: '2026-06-23T08:31:00' },
  { id: 's4', ticketId: 'TKT-004', visitorName: 'Sara Lee',    result: 'approved', time: '2026-06-23T08:45:00' },
]
