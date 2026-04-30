import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function RotaSoCidadao({ children }) {
  const tipoUsuario = useAuthStore((s) => s.tipoUsuario)
  const modoAtuacaoAdmin = useAuthStore((s) => s.modoAtuacaoAdmin)
  if (tipoUsuario !== 'ADMIN') return children
  if (modoAtuacaoAdmin === 'CIDADAO') return children
  return <Navigate to="/admin/mapa" replace />
}
