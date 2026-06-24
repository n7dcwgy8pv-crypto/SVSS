import { MOCK_USERS } from './mockData'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
let _users = [...MOCK_USERS]

export const getUsersApi = async () => {
  await delay(400)
  return _users
}

export const createUserApi = async (data) => {
  await delay(500)
  const existing = _users.find((u) => u.email === data.email)
  if (existing) throw new Error('A user with this email already exists.')
  const newUser = {
    id: `u${Date.now()}`,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role: data.role,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  }
  _users = [..._users, newUser]
  return newUser
}

export const toggleUserStatusApi = async (id) => {
  await delay(300)
  const idx = _users.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error('User not found.')
  _users[idx] = {
    ..._users[idx],
    status: _users[idx].status === 'active' ? 'inactive' : 'active',
  }
  return _users[idx]
}
