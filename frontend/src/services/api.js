import axios from 'axios'

// Instância do axios apontando para o backend
const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// Interceptor: anexa o token JWT em toda requisição que sair do frontend
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
