// ============================================================
// Mock data — replace each function body with real API calls
// when a backend is available.
// ============================================================

export const MOCK_USERS = [
  { id: 'u1', name: 'Alice Admin',    email: 'admin@svss.io',    role: 'admin',    status: 'active',   createdAt: '2026-01-10' },
  { id: 'u2', name: 'Bob Security',   email: 'bob@svss.io',      role: 'security', status: 'active',   createdAt: '2026-01-15' },
  { id: 'u3', name: 'Carol Guard',    email: 'carol@svss.io',    role: 'security', status: 'active',   createdAt: '2026-02-01' },
  { id: 'u4', name: 'Dave Operator',  email: 'dave@svss.io',     role: 'security', status: 'inactive', createdAt: '2026-02-20' },
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

export const MOCK_RECENT_SCANS = [
  { id: 's1', ticketId: 'TKT-001', visitorName: 'John Doe',    result: 'approved', time: '2026-06-23T08:10:00' },
  { id: 's2', ticketId: 'TKT-002', visitorName: 'Jane Smith',  result: 'rejected', time: '2026-06-23T08:22:00' },
  { id: 's3', ticketId: 'TKT-005', visitorName: 'Carlos Ruiz', result: 'approved', time: '2026-06-23T08:31:00' },
  { id: 's4', ticketId: 'TKT-004', visitorName: 'Sara Lee',    result: 'approved', time: '2026-06-23T08:45:00' },
]
