import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

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

  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleCPF = (e) => setCpf(formatCPF(e.target.value))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const cpfLimpo = cpf.replace(/\D/g, '')
      const { data } = await api.post('/auth/login', { cpf: cpfLimpo, senha })
      login(data.access_token, data.tipo_usuario, data.nome)

      if (data.tipo_usuario === 'admin') {
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

      {/* Header sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(161,93%,30%)]">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#171717]">Connect Cidade</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[#171717]/60 hover:text-[#171717] transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[hsl(161,93%,30%)] text-white hover:bg-[hsl(161,93%,25%)] transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(0,0%,96%)]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

        {/* Logo / Título */}
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold text-[#171717] tracking-tight">
            Entrar
          </p>
          <p className="mt-2 text-sm text-[#171717]/50">
            Entre na sua conta
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#171717]/60 uppercase tracking-wide">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPF}
              placeholder="000.000.000-00"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#171717]/10 text-[#171717] placeholder-[#171717]/25 text-sm focus:outline-none focus:border-[hsl(161,93%,30%)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#171717]/60 uppercase tracking-wide">
              Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#171717]/10 text-[#171717] placeholder-[#171717]/25 text-sm focus:outline-none focus:border-[hsl(161,93%,30%)] transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#171717]/30 hover:text-[#171717]/60 transition-colors text-xs"
              >
                {mostrarSenha ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-500 text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 w-full py-3 rounded-xl bg-[hsl(161,93%,30%)] text-white font-medium text-sm hover:bg-[hsl(161,93%,25%)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Link para cadastro */}
        <p className="mt-6 text-center text-sm text-[#171717]/40">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-[hsl(161,93%,30%)] font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
