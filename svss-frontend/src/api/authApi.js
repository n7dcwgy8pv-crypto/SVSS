import apiClient from './apiClient'

// ── Staff authentication (admin / security only) ─────────────────────────────

export const loginApi = async ({ email, password }) => {
  const res = await apiClient.post('/auth/login', { email, password })
  // res.data = { success: true, data: { user, token } }
  return res.data.data
}

export const registerApi = async (data) => {
  const res = await apiClient.post('/auth/register', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    password: data.password,
    confirmPassword: data.confirmPassword,
  })
  return res.data.data
}

export const logoutApi = async () => {
  await apiClient.post('/auth/logout')
  return { success: true }
}

// ── Customer authentication (customer role only) ──────────────────────────────

export const customerLoginApi = async ({ email, password }) => {
  const res = await apiClient.post('/customer/auth/login', { email, password })
  return res.data.data
}

export const customerRegisterApi = async (data) => {
  const res = await apiClient.post('/customer/auth/register', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    confirmPassword: data.confirmPassword,
    // role is intentionally omitted — server always sets it to 'customer'
  })
  return res.data.data
}

export const customerLogoutApi = async () => {
  await apiClient.post('/customer/auth/logout')
  return { success: true }
}

// ── Session / Profile ─────────────────────────────────────────────────────────

export const getMeApi = async () => {
  const res = await apiClient.get('/me')
  return res.data.data
}
