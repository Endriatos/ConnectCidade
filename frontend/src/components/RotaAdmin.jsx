import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import RotaProtegida from './RotaProtegida'

export default function RotaAdmin({ children }) {
  const tipoUsuario = useAuthStore(state => state.tipoUsuario)

  return (
    <RotaProtegida>
      {tipoUsuario === 'ADMIN' ? children : <Navigate to="/home" replace />}
    </RotaProtegida>
  )
}
