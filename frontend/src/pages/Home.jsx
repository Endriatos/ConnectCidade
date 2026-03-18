import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plus, LogOut, User, ChevronDown } from 'lucide-react'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'

export default function Home() {
  const { nome, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const [modalAberto, setModalAberto] = useState(location.state?.recemCadastrado === true)
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>

          <Link to="/home" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>

          {/* Menu do usuário com dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
            >
              <User className="h-4 w-4 text-[#2a2a2a]/40" />
              {primeiroNome}
              <ChevronDown className="h-3.5 w-3.5 text-[#2a2a2a]/40" />
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-[#2a2a2a]/40" />
                  Sair
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 bg-[#f5f5f5]">
        <div className="mx-auto px-6 py-10 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <div>
            <h1 className="text-4xl font-semibold text-[#2a2a2a]">Olá, {primeiroNome}!</h1>
            <p className="text-base text-[#2a2a2a]/50 mt-2">Veja os problemas reportados na sua região</p>
          </div>
          <Link
            to="/nova-solicitacao"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3cb478] text-white text-base font-medium hover:bg-[#349d69] transition-colors"
          >
            <Plus className="h-5 w-5" />
            Registrar Problema
          </Link>
        </div>
      </main>

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
