import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// Guarda de rota — bloqueia acesso a páginas que exigem autenticação
export default function RotaProtegida({ children }) {
  const token = useAuthStore(state => state.token)
  const loggedOut = useAuthStore(state => state.loggedOut)
  const location = useLocation()

  if (!token) {
    // Logout voluntário: volta para a landing sem aviso
    if (loggedOut) {
      return <Navigate to="/" replace />
    }
    // Acesso direto sem login: redireciona para o login com aviso e salva a rota de origem
    return <Navigate to="/login" state={{ avisoLogin: true, from: location.pathname }} replace />
  }

  return children
}
