import axios from 'axios'

/** Chuẩn hóa base (tránh nhầm `http://localhost:5055` thiếu `/api`). */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL
  if (raw != null && String(raw).trim() !== '') {
    const trimmed = String(raw).trim().replace(/\/+$/, '')
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
  }
  return '/api'
}

const api = axios.create({
  baseURL: resolveApiBase(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiError(error, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  return error?.response?.data?.message || fallback
}

export default api
