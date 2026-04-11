import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, UserX } from 'lucide-react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import { mensagemErroApi } from '../../utils/meuPerfilForm'
import ModalEncerrarConta from './ModalEncerrarConta'

export default function CardEncerrarConta() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const [modalAberto, setModalAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

  const fecharModal = () => {
    setModalAberto(false)
    setErroExcluir('')
  }

  const confirmarExclusao = async () => {
    setExcluindo(true)
    setErroExcluir('')
    try {
      await api.delete('/usuarios/me')
      fecharModal()
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setErroExcluir(mensagemErroApi(err))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">Encerrar conta</h2>
        <p className="mt-1 text-sm text-[#2a2a2a]/45">Remove o acesso à plataforma e anonimiza seus dados pessoais.</p>
        <div className="mt-4 flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-[#2a2a2a]/50">
            Você não poderá mais entrar com esta conta. As solicitações que você fez continuam registradas, sem vínculo com a sua identidade, em linha com a LGPD.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalAberto(true)
            setErroExcluir('')
          }}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
        >
          <UserX className="h-4 w-4 shrink-0" />
          Encerrar minha conta
        </button>
      </div>

      <ModalEncerrarConta
        aberto={modalAberto}
        excluindo={excluindo}
        erroExcluir={erroExcluir}
        onFechar={fecharModal}
        onConfirmar={confirmarExclusao}
      />
    </>
  )
}
