import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ChevronDown, LogOut, ClipboardList, Bell, LayoutDashboard } from 'lucide-react'
import useAuthStore from '../store/authStore'
import iconCC from '../assets/iconCC.png'

export default function Header() {
  const { nome, logout, tipoUsuario } = useAuthStore()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const nomePerfil = primeiroNome
    ? `${primeiroNome.charAt(0).toUpperCase()}${primeiroNome.slice(1)}`
    : 'Usuário'

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
    <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        <Link
          to="/home"
          className="flex items-center gap-2 shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3cb478]/35 focus-visible:ring-offset-2"
          aria-label="Ir para o mapa"
        >
          <img src={iconCC} alt="" className="h-9 w-9 object-contain" />
          <span className="hidden md:block text-[15px] font-semibold text-[#2a2a2a] tracking-tight">
            Connect Cidade
          </span>
        </Link>

        <div className="flex-1 min-w-[100px]" />

        <div className="flex items-center gap-2 min-w-0">
          {tipoUsuario === 'ADMIN' && (
            <Link
              to="/admin/solicitacoes"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#3cb478]/40 text-sm font-medium text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Painel administrativo</span>
            </Link>
          )}
          <button
            type="button"
            aria-label="Notificações"
            className="inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-lg border border-[#2a2a2a]/10 text-[#2a2a2a]/60 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a] transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="inline-flex items-center gap-1.5 sm:gap-2 max-w-[min(100%,11rem)] sm:max-w-none h-9 px-2.5 sm:px-3 rounded-lg border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
            >
              <User className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
              <span className="truncate">{nomePerfil}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" />
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-1 min-w-[13rem] rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg py-1 z-50">
                <Link
                  to="/minhas-solicitacoes"
                  onClick={() => setMenuAberto(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <ClipboardList className="h-4 w-4 text-[#2a2a2a]/40" />
                  Minhas solicitações
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-[#2a2a2a]/40" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}
