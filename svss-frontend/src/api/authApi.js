// Auth API — uses mock data; swap with real API calls when backend is ready
import { MOCK_USERS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export const loginApi = async ({ email, password }) => {
  await delay(600)
  const user = MOCK_USERS.find(
    (u) => u.email === email && u.status === 'active'
  )
  if (!user || password.length < 4) {
    throw new Error('Invalid credentials. Please check your email and password.')
  }
  return { user, token: `mock-token-${user.id}-${Date.now()}` }
}

export const registerApi = async (data) => {
  await delay(700)
  const existing = MOCK_USERS.find((u) => u.email === data.email)
  if (existing) throw new Error('An account with this email already exists.')
  const newUser = {
    id: `u${Date.now()}`,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role: data.role || 'security',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  }
  return { user: newUser, token: `mock-token-${newUser.id}` }
}

export const logoutApi = async () => {
  await delay(200)
  return { success: true }
}
