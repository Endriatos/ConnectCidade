import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function RotaHome({ children }) {
  const tipoUsuario = useAuthStore((s) => s.tipoUsuario)
  const modoAtuacaoAdmin = useAuthStore((s) => s.modoAtuacaoAdmin)

  if (tipoUsuario !== 'ADMIN') return children
  if (modoAtuacaoAdmin == null) return <Navigate to="/continuar" replace />
  if (modoAtuacaoAdmin === 'ADMIN') return <Navigate to="/admin/mapa" replace />
  return children
}
