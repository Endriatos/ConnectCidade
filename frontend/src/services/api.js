import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

const tokenExpirado = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (tokenExpirado(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('tipoUsuario')
      localStorage.removeItem('nomeUsuario')
      if (config.url !== '/auth/login') {
        window.location.href = '/login?sessao=expirada'
        return Promise.reject(new Error('sessao_expirada'))
      }
      return config
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === '/auth/login'
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
