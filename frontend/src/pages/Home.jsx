import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'

export default function Home() {
  const { nome, logout } = useAuthStore()
  const navigate = useNavigate()

  // Exibe apenas o primeiro nome no header
  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'

  // Limpa a sessão e redireciona para a landing
  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header fixo no topo */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/home" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <div className="flex items-center gap-3 translate-y-px">
            {/* Exibe o primeiro nome do usuário logado */}
            <button className="text-sm font-medium px-4 py-2 rounded-lg border border-[#171717]/10 text-[#171717] hover:bg-[#171717]/5 transition-colors">
              {primeiroNome}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[hsl(161,93%,30%)] text-white hover:bg-[hsl(161,93%,25%)] transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Área principal — conteúdo a ser desenvolvido */}
      <div className="flex-1 bg-[hsl(0,0%,96%)] flex items-center justify-center">
        <p className="text-[#171717]/50 text-sm">Você está logado.</p>
      </div>

    </div>
  )
}
