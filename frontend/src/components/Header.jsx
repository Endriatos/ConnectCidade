import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ChevronDown, LogOut, ClipboardList, Bell, Shield, UserCircle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import iconCC from '../assets/iconCC.png'

function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

export default function Header() {
  const { nome, logout, tipoUsuario } = useAuthStore()
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  const [notifAberto, setNotifAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const notifRef = useRef(null)

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const nomePerfil = primeiroNome
    ? `${primeiroNome.charAt(0).toUpperCase()}${primeiroNome.slice(1)}`
    : 'Usuário'

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  useEffect(() => {
    api.get('/notificacoes').then((res) => setNotificacoes(res.data)).catch(() => {})
  }, [])

  const abrirNotif = () => {
    setNotifAberto(true)
    api.get('/notificacoes').then((res) => setNotificacoes(res.data)).catch(() => {})
  }

  const fecharNotif = useCallback(() => {
    setNotifAberto(false)
    setNotificacoes((prev) => {
      if (prev.some((n) => !n.lida)) {
        api.patch('/notificacoes/lidas').catch(() => {})
        return prev.map((n) => ({ ...n, lida: true }))
      }
      return prev
    })
  }, [])

  useEffect(() => {
    function handleClickFora(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) fecharNotif()
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [fecharNotif])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const ultimas5 = notificacoes.slice(0, 5)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
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
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Painel administrativo</span>
            </Link>
          )}

          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Notificações"
              onClick={() => notifAberto ? fecharNotif() : abrirNotif()}
              className="relative inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-lg border border-[#2a2a2a]/10 text-[#2a2a2a]/60 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a] transition-colors"
            >
              <Bell className="h-4 w-4" />
              {naoLidas > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            {notifAberto && (
              <div className="absolute right-0 mt-1 w-80 rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-black/8">
                  <p className="text-sm font-semibold text-[#2a2a2a]">Notificações</p>
                </div>
                {ultimas5.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[#2a2a2a]/40 text-center">Nenhuma notificação.</p>
                ) : (
                  <ul>
                    {ultimas5.map((n) => (
                      <li key={n.id_notificacao}>
                        <Link
                          to={`/minhas-solicitacoes/${n.id_solicitacao}`}
                          onClick={fecharNotif}
                          className={`block px-4 py-3 border-b border-black/5 last:border-0 hover:bg-[#2a2a2a]/4 transition-colors ${!n.lida ? 'bg-[#3cb478]/6' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              {!n.lida && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3cb478]" />}
                              <p className={`text-sm leading-snug text-[#2a2a2a] ${!n.lida ? 'font-medium' : ''} ${n.lida ? 'pl-3.5' : ''}`}>
                                {n.mensagem}
                              </p>
                            </div>
                            <span className="text-xs text-[#2a2a2a]/35 shrink-0 mt-0.5">{tempoRelativo(n.data_criacao)}</span>
                          </div>
                          <p className="text-xs text-[#2a2a2a]/40 mt-1 font-mono pl-3.5">#{n.protocolo}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Menu do usuário */}
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
                <Link
                  to="/meu-perfil"
                  onClick={() => setMenuAberto(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-[#2a2a2a]/40" />
                  Meu perfil
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
