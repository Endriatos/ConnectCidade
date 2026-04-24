import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Shield } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function ContinuarAposLogin() {
  const navigate = useNavigate()
  const tipoUsuario = useAuthStore((s) => s.tipoUsuario)
  const modoAtuacaoAdmin = useAuthStore((s) => s.modoAtuacaoAdmin)
  const setModoAtuacaoAdmin = useAuthStore((s) => s.setModoAtuacaoAdmin)

  useEffect(() => {
    if (tipoUsuario !== 'ADMIN') {
      navigate('/home', { replace: true })
      return
    }
    if (modoAtuacaoAdmin === 'CIDADAO') {
      navigate('/home', { replace: true })
      return
    }
    if (modoAtuacaoAdmin === 'ADMIN') {
      navigate('/admin/solicitacoes', { replace: true })
    }
  }, [tipoUsuario, modoAtuacaoAdmin, navigate])

  if (tipoUsuario !== 'ADMIN' || modoAtuacaoAdmin === 'CIDADAO' || modoAtuacaoAdmin === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-sm text-[#2a2a2a]/50">Carregando…</p>
      </div>
    )
  }

  const escolher = (modo) => {
    setModoAtuacaoAdmin(modo)
    if (modo === 'CIDADAO') navigate('/home', { replace: true })
    else navigate('/admin/solicitacoes', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/8 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold text-[#2a2a2a]">Como deseja continuar?</h1>
        <p className="mt-2 text-center text-sm text-[#2a2a2a]/50">
          Sua conta tem perfil de administrador. Você pode usar o mapa e as funções de cidadão ou ir direto ao painel da gestão.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => escolher('CIDADAO')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2a2a]/12 bg-white px-5 py-4 text-sm font-medium text-[#2a2a2a] transition-colors hover:bg-[#f8f8f8]"
          >
            <MapPin className="h-5 w-5 text-[#3cb478]" />
            Mapa e área do cidadão
          </button>
          <button
            type="button"
            onClick={() => escolher('ADMIN')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3cb478] px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-[#349d69]"
          >
            <Shield className="h-5 w-5" />
            Painel administrativo
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-[#2a2a2a]/40">
          No painel, use <span className="font-medium text-[#2a2a2a]/55">Mapa</span> na barra lateral. Para sair do modo gestão, abra o menu do seu nome e escolha <span className="font-medium text-[#2a2a2a]/55">Perfil de cidadão</span>.
        </p>
      </div>
    </div>
  )
}
