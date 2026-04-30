import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ChevronDown, LogOut, ClipboardList, Bell, UserCircle, Shield } from 'lucide-react'
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
  const nome = useAuthStore((s) => s.nome)
  const logout = useAuthStore((s) => s.logout)
  const tipoUsuario = useAuthStore((s) => s.tipoUsuario)
  const modoAtuacaoAdmin = useAuthStore((s) => s.modoAtuacaoAdmin)
  const setModoAtuacaoAdmin = useAuthStore((s) => s.setModoAtuacaoAdmin)
  const navigate = useNavigate()
  const destinoLogo =
    tipoUsuario === 'ADMIN' && modoAtuacaoAdmin === 'ADMIN' ? '/admin/mapa' : '/home'
  const exibirMinhasSolicitacoes = tipoUsuario !== 'ADMIN' || modoAtuacaoAdmin === 'CIDADAO'

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  const [notifAberto, setNotifAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const notifRef = useRef(null)
  const modoNotificacao = tipoUsuario === 'ADMIN' ? (modoAtuacaoAdmin ?? 'ADMIN') : 'CIDADAO'

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const nomePerfil = primeiroNome
    ? `${primeiroNome.charAt(0).toUpperCase()}${primeiroNome.slice(1)}`
    : 'Usuário'

  const naoLidas = notificacoes.filter((n) => !n.lida).length
  const listaNaoLidas = notificacoes.filter((n) => !n.lida).slice(0, 5)

  useEffect(() => {
    api
      .get('/notificacoes', { params: { modo_atuacao: modoNotificacao } })
      .then((res) => setNotificacoes(res.data))
      .catch(() => {})
  }, [modoNotificacao])

  const abrirNotif = () => {
    setNotifAberto(true)
    api
      .get('/notificacoes', { params: { modo_atuacao: modoNotificacao } })
      .then((res) => setNotificacoes(res.data))
      .catch(() => {})
  }

  const fecharNotif = useCallback(() => {
    setNotifAberto(false)
  }, [])

  const aoClicarNotificacao = useCallback(
    (n) => {
      void api
        .patch(`/notificacoes/${n.id_notificacao}/lida`)
        .then(() => {
          setNotificacoes((prev) =>
            prev.map((x) => (x.id_notificacao === n.id_notificacao ? { ...x, lida: true } : x)),
          )
        })
        .catch(() => undefined)
        .finally(() => {
          setNotifAberto(false)
          if (tipoUsuario === 'ADMIN' && modoAtuacaoAdmin === 'ADMIN') {
            navigate('/admin/solicitacoes')
          } else {
            navigate(`/minhas-solicitacoes/${n.id_solicitacao}`)
          }
        })
    },
    [navigate, tipoUsuario, modoAtuacaoAdmin],
  )

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

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto flex h-16 min-w-0 max-w-[1400px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">

        <Link
          to={destinoLogo}
          className="flex items-center gap-2 shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3cb478]/35 focus-visible:ring-offset-2"
          aria-label="Ir para o mapa"
        >
          <img src={iconCC} alt="" className="h-9 w-9 object-contain" />
          <span className="hidden md:block text-[15px] font-semibold text-[#2a2a2a] tracking-tight">
            Connect Cidade
          </span>
        </Link>

        <div className="min-w-0 flex-1" />

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">

          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : 'Notificações'}
              onClick={() => (notifAberto ? fecharNotif() : abrirNotif())}
              className="relative inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-lg border border-[#2a2a2a]/10 text-[#2a2a2a]/60 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]"
            >
              <Bell className="h-4 w-4" />
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {naoLidas > 5 ? '5+' : naoLidas}
                </span>
              )}
            </button>

            {notifAberto && (
              <div
                className="z-50 overflow-hidden rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[calc(4rem+0.35rem)] max-sm:max-h-[min(70dvh,28rem)] max-sm:overflow-y-auto sm:absolute sm:right-0 sm:mt-1 sm:max-h-none sm:w-80 sm:max-w-none"
              >
                <div className="px-4 py-3 border-b border-black/8">
                  <p className="text-sm font-semibold text-[#2a2a2a]">Notificações</p>
                </div>
                {listaNaoLidas.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[#2a2a2a]/40 text-center">
                    {notificacoes.length > 0 ? 'Nenhuma notificação nova.' : 'Nenhuma notificação.'}
                  </p>
                ) : (
                  <ul>
                    {listaNaoLidas.map((n) => (
                      <li key={n.id_notificacao}>
                        <button
                          type="button"
                          onClick={() => aoClicarNotificacao(n)}
                          className="block w-full px-4 py-3 border-b border-black/5 last:border-0 text-left hover:bg-[#2a2a2a]/4 transition-colors bg-[#3cb478]/6"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3cb478]" />
                              <p className="min-w-0 break-words text-sm font-medium leading-snug text-[#2a2a2a]">
                                {n.mensagem}
                              </p>
                            </div>
                            <span className="text-xs text-[#2a2a2a]/35 shrink-0 mt-0.5">{tempoRelativo(n.data_criacao)}</span>
                          </div>
                          <p className="text-xs text-[#2a2a2a]/40 mt-1 font-mono pl-3.5">#{n.protocolo}</p>
                        </button>
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
              className="inline-flex h-9 max-w-[min(100%,9.5rem)] items-center gap-1.5 rounded-lg border border-[#2a2a2a]/10 px-2 text-sm text-[#2a2a2a] transition-colors hover:bg-[#2a2a2a]/5 sm:max-w-[min(100%,11rem)] sm:gap-2 sm:px-3"
            >
              <User className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
              <span className="truncate">{nomePerfil}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" />
            </button>

            {menuAberto && (
              <div className="z-50 w-[min(13rem,calc(100vw-1.5rem))] rounded-xl border border-[#2a2a2a]/8 bg-white py-1 shadow-lg max-sm:fixed max-sm:right-3 max-sm:top-[calc(4rem+0.35rem)] sm:absolute sm:right-0 sm:mt-1 sm:min-w-[13rem] sm:w-auto">
                {exibirMinhasSolicitacoes && (
                  <Link
                    to="/minhas-solicitacoes"
                    onClick={() => setMenuAberto(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 text-[#2a2a2a]/40" />
                    Minhas solicitações
                  </Link>
                )}
                {tipoUsuario === 'ADMIN' && modoAtuacaoAdmin === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false)
                      setModoAtuacaoAdmin('CIDADAO')
                      navigate('/home')
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] transition-colors hover:bg-[#2a2a2a]/5"
                  >
                    <User className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
                    Perfil de cidadão
                  </button>
                )}
                <Link
                  to="/meu-perfil"
                  onClick={() => setMenuAberto(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-[#2a2a2a]/40" />
                  Meu perfil
                </Link>
                {tipoUsuario === 'ADMIN' && modoAtuacaoAdmin === 'CIDADAO' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false)
                      setModoAtuacaoAdmin('ADMIN')
                      navigate('/admin/mapa')
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] transition-colors hover:bg-[#2a2a2a]/5"
                  >
                    <Shield className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
                    Perfil admin
                  </button>
                )}
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
