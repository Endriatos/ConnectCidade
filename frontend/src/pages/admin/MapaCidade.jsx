import useAuthStore from '../../store/authStore'
import Mapa from '../Mapa'

export default function MapaCidade() {
  const nome = useAuthStore((s) => s.nome)
  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const nomeSaudacao = primeiroNome
    ? `${primeiroNome.charAt(0).toUpperCase()}${primeiroNome.slice(1)}`
    : 'Usuário'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#2a2a2a]">Olá, {nomeSaudacao}!</h1>
          <p className="mt-0.5 text-sm text-[#2a2a2a]/50">
            Acompanhe no mapa as solicitações da cidade e priorize os atendimentos.
          </p>
        </div>
        <div className="rounded-2xl border border-black/8 shadow-sm" style={{ height: '70vh' }}>
          <Mapa />
        </div>
      </div>
    </div>
  )
}
