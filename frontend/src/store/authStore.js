import { create } from 'zustand'

function readModoAtuacaoAdminInicial() {
  const t = localStorage.getItem('tipoUsuario')
  if (t !== 'ADMIN') return null
  const m = localStorage.getItem('modoAtuacaoAdmin')
  return m === 'CIDADAO' || m === 'ADMIN' ? m : null
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  tipoUsuario: localStorage.getItem('tipoUsuario') || null,
  nome: localStorage.getItem('nomeUsuario') || null,
  modoAtuacaoAdmin: readModoAtuacaoAdminInicial(),
  loggedOut: false,

  login: (token, tipoUsuario) => {
    localStorage.setItem('token', token)
    localStorage.setItem('tipoUsuario', tipoUsuario)
    if (tipoUsuario !== 'ADMIN') {
      localStorage.removeItem('modoAtuacaoAdmin')
      set({ token, tipoUsuario, modoAtuacaoAdmin: null, loggedOut: false })
      return
    }
    const m = localStorage.getItem('modoAtuacaoAdmin')
    const modo = m === 'CIDADAO' || m === 'ADMIN' ? m : null
    set({ token, tipoUsuario, modoAtuacaoAdmin: modo, loggedOut: false })
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
