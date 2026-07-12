import axios from 'axios'
import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to the correct portal login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const user = useAuthStore.getState().user
      useAuthStore.getState().logout()
      window.location.href = user?.role === 'customer' ? '/customer/login' : '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
