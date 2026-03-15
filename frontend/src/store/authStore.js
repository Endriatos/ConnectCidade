import { create } from 'zustand'

// Store global de autenticação — persiste token e dados do usuário no localStorage
const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  tipoUsuario: localStorage.getItem('tipoUsuario') || null,
  nome: localStorage.getItem('nomeUsuario') || null,
  loggedOut: false, // indica se o usuário fez logout voluntário (usado pela RotaProtegida)

  // Salva token e tipo de usuário após login bem-sucedido
  login: (token, tipoUsuario) => {
    localStorage.setItem('token', token)
    localStorage.setItem('tipoUsuario', tipoUsuario)
    set({ token, tipoUsuario, loggedOut: false })
  },

  // Salva o nome do usuário separadamente (obtido via /auth/me)
  setNome: (nome) => {
    localStorage.setItem('nomeUsuario', nome)
    set({ nome })
  },

  // Remove todos os dados de sessão
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    set({ token: null, tipoUsuario: null, nome: null, loggedOut: true })
  },
}))

export default useAuthStore
