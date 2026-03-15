import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'

export default function Home() {
  const { nome, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Exibe apenas o primeiro nome no header
  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'

  // Abre o modal apenas se vier do cadastro
  const [modalAberto, setModalAberto] = useState(location.state?.recemCadastrado === true)

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
            <button className="text-sm font-medium px-4 py-2 rounded-lg border border-[#2a2a2a]/10 text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors">
              {primeiroNome}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#3cb478] text-white hover:bg-[#349d69] transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Área principal — conteúdo a ser desenvolvido */}
      <div className="flex-1 bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-[#2a2a2a]/50 text-sm">Você está logado.</p>
      </div>

      {/* Modal de boas-vindas após cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-sm text-center mx-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#3cb478]/10 mx-auto mb-5">
              <svg className="w-7 h-7 text-[#3cb478]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
              Boas-vindas, {primeiroNome}!
            </p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">
              Sua conta foi criada com sucesso. Agora você já pode usar o Connect Cidade.
            </p>
            <button
              onClick={() => setModalAberto(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
            >
              Começar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
