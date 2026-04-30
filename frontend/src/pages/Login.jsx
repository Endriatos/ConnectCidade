import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, X, MailCheck } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'

function ModalEmailNaoConfirmado({ email, cpf, onFechar }) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  const reenviar = async () => {
    setEnviando(true)
    setErroEnvio('')
    try {
      await api.post('/auth/reenviar-verificacao', { cpf })
      setEnviado(true)
    } catch {
      setErroEnvio('Não foi possível reenviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl px-8 py-10 text-center">
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <MailCheck className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">E-mail não confirmado</p>
        <p className="mt-3 text-sm text-[#2a2a2a]/60 leading-relaxed">
          O e-mail{' '}
          <span className="font-medium text-[#2a2a2a]">{email}</span>{' '}
          ainda não foi confirmado. Acesse sua caixa de entrada e clique no link de ativação.
        </p>
        <p className="mt-2 text-xs text-[#2a2a2a]/35">Não esqueça de verificar o spam.</p>

        {enviado ? (
          <p className="mt-8 rounded-xl bg-[#3cb478]/10 px-4 py-3 text-sm font-medium text-[#2a7a4a]">
            E-mail reenviado! Verifique sua caixa de entrada.
          </p>
        ) : (
          <>
            {erroEnvio && <p className="mt-4 text-sm text-red-500">{erroEnvio}</p>}
            <button
              onClick={reenviar}
              disabled={enviando}
              className="mt-8 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {enviando ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
            </button>
          </>
        )}

        <button
          onClick={onFechar}
          className="mt-3 w-full py-2 text-sm text-[#2a2a2a]/50 hover:text-[#2a2a2a] transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// Formata o CPF digitado para o padrão 000.000.000-00
function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function Login() {
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalPendente, setModalPendente] = useState({ visivel: false, email: '' })

  const login = useAuthStore((s) => s.login)
  const setNome = useAuthStore((s) => s.setNome)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!token) return
    const tipo = useAuthStore.getState().tipoUsuario
    const modo = useAuthStore.getState().modoAtuacaoAdmin
    if (tipo !== 'ADMIN') {
      navigate('/home', { replace: true })
      return
    }
    if (modo === 'CIDADAO') {
      navigate('/home', { replace: true })
      return
    }
    navigate('/admin/mapa', { replace: true })
  }, [token, navigate])

  const sessaoExpirada = new URLSearchParams(location.search).get('sessao') === 'expirada'
  const avisoLogin = location.state?.avisoLogin

  const handleCPF = (e) => setCpf(formatCPF(e.target.value))

  // Envia as credenciais, salva o token e redireciona conforme o perfil
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const cpfLimpo = cpf.replace(/\D/g, '')
      const { data } = await api.post('/auth/login', { cpf: cpfLimpo, senha })
      login(data.access_token, data.tipo_usuario)

      // Busca o nome do usuário para exibir no header
      const me = await api.get('/auth/me')
      setNome(me.data.nome_usuario)

      const destino = location.state?.from
      const setModo = useAuthStore.getState().setModoAtuacaoAdmin
      const tipo = data.tipo_usuario

      if (tipo !== 'ADMIN') {
        if (destino) navigate(destino, { replace: true })
        else navigate('/home', { replace: true })
        return
      }

      if (destino) {
        if (destino.startsWith('/admin')) {
          setModo('ADMIN')
          navigate(destino, { replace: true })
          return
        }
        if (destino === '/minhas-solicitacoes' || destino.startsWith('/minhas-solicitacoes/')) {
          setModo('CIDADAO')
          navigate(destino, { replace: true })
          return
        }
        navigate(destino, { replace: true })
        return
      }

      const modo = useAuthStore.getState().modoAtuacaoAdmin
      if (modo === 'CIDADAO') navigate('/home', { replace: true })
      else navigate('/admin/mapa', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.code === 'email_nao_confirmado') {
        setModalPendente({ visivel: true, email: detail.email })
      } else if (typeof detail === 'string' && detail.includes('bloqueada')) {
        setErro('Sua conta foi bloqueada. Entre em contato com o suporte.')
      } else {
        setErro((typeof detail === 'string' ? detail : null) || 'Erro ao fazer login.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header fixo no topo */}
      <header className="sticky top-0 z-40 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <div className="flex items-center gap-3 translate-y-px">
            <Link
              to="/login"
              className="text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#3cb478] text-white hover:bg-[#349d69] transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

          {sessaoExpirada && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
              <p className="text-sm text-amber-700">Sua sessão expirou. Faça login novamente.</p>
            </div>
          )}

          {/* Aviso exibido quando o usuário tenta acessar uma rota protegida sem estar logado */}
          {avisoLogin && !sessaoExpirada && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
              <p className="text-sm text-amber-700">É necessário fazer login para acessar esta página.</p>
            </div>
          )}

          {/* Ícone e título */}
          <div className="mb-8 text-center">
            <img src={iconCC} alt="Connect Cidade" className="h-14 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-[#2a2a2a] tracking-tight">Entrar</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">Entre na sua conta</p>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Campo CPF */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={handleCPF}
                placeholder="000.000.000-00"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/10 text-[#2a2a2a] placeholder-[#2a2a2a]/25 text-sm focus:outline-none focus:border-[#3cb478] transition-colors"
              />
            </div>

            {/* Campo senha com botão de visibilidade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/10 text-[#2a2a2a] placeholder-[#2a2a2a]/25 text-sm focus:outline-none focus:border-[#3cb478] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right -mt-2">
              <Link
                to="/esqueci-senha"
                className="text-xs text-[#2a2a2a]/40 hover:text-[#3cb478] transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para a página de cadastro */}
          <p className="mt-6 text-center text-sm text-[#2a2a2a]/40">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-[#3cb478] font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>

      {modalPendente.visivel && (
        <ModalEmailNaoConfirmado
          email={modalPendente.email}
          cpf={cpf.replace(/\D/g, '')}
          onFechar={() => setModalPendente({ visivel: false, email: '' })}
        />
      )}

    </div>
  )
}
