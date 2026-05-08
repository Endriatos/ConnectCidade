import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

function payloadJwt(token) {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const tokenExpirado = (token) => {
  const payload = payloadJwt(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 < Date.now()
}

function urlEhLogin(config) {
  const u = String(config?.url ?? '')
  const base = String(config?.baseURL ?? '')
  return u.includes('auth/login') || (base + u).includes('auth/login')
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (!token) return config

  const loginReq = urlEhLogin(config)

  if (tokenExpirado(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    if (!loginReq) {
      window.location.href = '/login?sessao=expirada'
      return Promise.reject(new Error('sessao_expirada'))
    }
    return config
  }

  if (!loginReq) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = urlEhLogin(error.config)
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('tipoUsuario')
      localStorage.removeItem('nomeUsuario')
      window.location.href = '/login?sessao=expirada'
    }
    return Promise.reject(error)
  }
)

export default api
