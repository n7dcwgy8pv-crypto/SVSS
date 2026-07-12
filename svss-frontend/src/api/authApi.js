// Auth API — uses mock data; swap with real API calls when backend is ready
import { MOCK_USERS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Staff authentication (admin / security only) ─────────────────────────────

export const loginApi = async ({ email, password }) => {
  await delay(600)
  const user = MOCK_USERS.find(
    (u) => u.email === email && u.status === 'active'
  )
  if (!user || password.length < 4) {
    throw new Error('Invalid credentials. Please check your email and password.')
  }
  // Block customers from using the staff portal
  if (user.role === 'customer') {
    throw new Error('Customer accounts must use the Customer Portal to sign in.')
  }
  return { user, token: `mock-token-${user.id}-${Date.now()}` }
}

export const registerApi = async (data) => {
  await delay(700)
  const existing = MOCK_USERS.find((u) => u.email === data.email)
  if (existing) throw new Error('An account with this email already exists.')
  // Staff registration only allows admin / security roles
  const staffRoles = ['admin', 'security']
  const role = staffRoles.includes(data.role) ? data.role : 'security'
  const newUser = {
    id: `u${Date.now()}`,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  }
  MOCK_USERS.push(newUser)
  return { user: newUser, token: `mock-token-${newUser.id}` }
}

// ── Customer authentication (customer role only) ──────────────────────────────

export const customerLoginApi = async ({ email, password }) => {
  await delay(600)
  const user = MOCK_USERS.find(
    (u) => u.email === email && u.status === 'active'
  )
  if (!user || password.length < 4) {
    throw new Error('Invalid credentials. Please check your email and password.')
  }
  // Block staff accounts from using the customer portal
  if (user.role !== 'customer') {
    throw new Error('Staff accounts must use the Staff Portal to sign in.')
  }
  return { user, token: `mock-token-${user.id}-${Date.now()}` }
}

export const customerRegisterApi = async (data) => {
  await delay(700)
  const existing = MOCK_USERS.find((u) => u.email === data.email)
  if (existing) throw new Error('An account with this email already exists.')
  // Customer registration always creates a customer account — role is never user-supplied
  const newUser = {
    id: `u${Date.now()}`,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role: 'customer',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  }
  MOCK_USERS.push(newUser)
  return { user: newUser, token: `mock-token-${newUser.id}` }
}

export const logoutApi = async () => {
  await delay(200)
  return { success: true }
}
