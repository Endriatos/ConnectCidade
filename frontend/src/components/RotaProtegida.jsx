import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// Guarda de rota — bloqueia acesso a páginas que exigem autenticação
export default function RotaProtegida({ children }) {
  const token = useAuthStore(state => state.token)
  const loggedOut = useAuthStore(state => state.loggedOut)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ avisoLogin: !loggedOut, from: loggedOut ? undefined : location.pathname }} replace />
  }

  return children
}
