import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import Lottie from 'lottie-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'
import typing from '../assets/Typing.json'

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
  const [modalSenha, setModalSenha] = useState(false)

  const { login, setNome } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

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

      // Redireciona para o painel correto conforme o tipo de usuário
      if (data.tipo_usuario === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/home')
      }
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Modal — funcionalidade em breve */}
      {modalSenha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModalSenha(false) }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-8">
            <button
              onClick={() => setModalSenha(false)}
              className="absolute top-4 right-4 text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <Lottie
                animationData={typing}
                loop
                autoplay
                style={{ width: 180, height: 180 }}
              />
              <div>
                <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
                  Coisas boas estão chegando!
                </p>
                <p className="mt-2 text-sm text-[#2a2a2a]/55 leading-relaxed">
                  Ainda estamos trabalhando nisso. Em breve você poderá redefinir sua senha por aqui.
                </p>
              </div>
              <button
                onClick={() => setModalSenha(false)}
                className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header fixo no topo */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
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

            {/* Link esqueceu a senha */}
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => setModalSenha(true)}
                className="text-xs text-[#2a2a2a]/40 hover:text-[#3cb478] transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Mensagem de erro da API */}
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
    </div>
  )
}
