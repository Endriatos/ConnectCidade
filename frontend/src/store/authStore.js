import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  tipoUsuario: localStorage.getItem('tipoUsuario') || null,
  nome: localStorage.getItem('nomeUsuario') || null,

  login: (token, tipoUsuario) => {
    localStorage.setItem('token', token)
    localStorage.setItem('tipoUsuario', tipoUsuario)
    set({ token, tipoUsuario })
  },

  setNome: (nome) => {
    localStorage.setItem('nomeUsuario', nome)
    set({ nome })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    set({ token: null, tipoUsuario: null, nome: null })
  },
}))

export default useAuthStore
