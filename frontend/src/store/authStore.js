import { create } from 'zustand'
import { modoInicialAdminPorUserAgent } from '../utils/modoInicialAdmin'

function readModoAtuacaoAdminInicial() {
  const t = localStorage.getItem('tipoUsuario')
  if (t !== 'ADMIN') return null
  const m = localStorage.getItem('modoAtuacaoAdmin')
  if (m === 'CIDADAO' || m === 'ADMIN') return m
  return modoInicialAdminPorUserAgent()
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  tipoUsuario: localStorage.getItem('tipoUsuario') || null,
  nome: localStorage.getItem('nomeUsuario') || null,
  modoAtuacaoAdmin: readModoAtuacaoAdminInicial(),
  loggedOut: false,

  login: (token, tipoUsuario) => {
    const tipoNorm =
      tipoUsuario != null ? String(tipoUsuario).toUpperCase() : tipoUsuario
    localStorage.setItem('token', token)
    localStorage.setItem('tipoUsuario', tipoNorm)
    if (tipoNorm !== 'ADMIN') {
      localStorage.removeItem('modoAtuacaoAdmin')
      set({ token, tipoUsuario: tipoNorm, modoAtuacaoAdmin: null, loggedOut: false })
      return
    }
    const modoInicial = modoInicialAdminPorUserAgent()
    localStorage.setItem('modoAtuacaoAdmin', modoInicial)
    set({ token, tipoUsuario: tipoNorm, modoAtuacaoAdmin: modoInicial, loggedOut: false })
  },

  setModoAtuacaoAdmin: (modo) => {
    localStorage.setItem('modoAtuacaoAdmin', modo)
    set({ modoAtuacaoAdmin: modo })
  },

  setNome: (nome) => {
    localStorage.setItem('nomeUsuario', nome)
    set({ nome })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    localStorage.removeItem('modoAtuacaoAdmin')
    set({ token: null, tipoUsuario: null, nome: null, modoAtuacaoAdmin: null, loggedOut: true })
  },
}))

export default useAuthStore
