import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import api from '../services/api'
import {
  avaliarForca,
  classeInput,
  infoForca,
  mensagemErroApi,
  validarCampoSenha,
} from '../utils/meuPerfilForm'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [tokenStatus, setTokenStatus] = useState('verificando') // 'verificando' | 'valido' | 'invalido'
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirmar, setSenhaConfirmar] = useState('')
  const [mostrarNova, setMostrarNova] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [erros, setErros] = useState({ senha_nova: '', confirmar_senha: '' })
  const [erroApi, setErroApi] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!token.trim()) { setTokenStatus('invalido'); return }
    api.get(`/auth/validar-token-recuperacao?token=${encodeURIComponent(token)}`)
      .then(() => setTokenStatus('valido'))
      .catch(() => setTokenStatus('invalido'))
  }, [token])

  const formularioValido =
    !validarCampoSenha('senha_nova', '', senhaNova, senhaConfirmar) &&
    !validarCampoSenha('confirmar_senha', '', senhaNova, senhaConfirmar)

  const blur = (field) => {
    const msg = validarCampoSenha(field, '', senhaNova, senhaConfirmar)
    setErros((prev) => ({ ...prev, [field]: msg }))
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErroApi('')
    const novos = {
      senha_nova: validarCampoSenha('senha_nova', '', senhaNova, senhaConfirmar),
      confirmar_senha: validarCampoSenha('confirmar_senha', '', senhaNova, senhaConfirmar),
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return

    setCarregando(true)
    try {
      await api.post('/auth/redefinir-senha', { token, nova_senha: senhaNova })
      setSucesso(true)
    } catch (err) {
      setErroApi(mensagemErroApi(err))
    } finally {
      setCarregando(false)
    }
  }

  if (tokenStatus === 'verificando') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
            <Link to="/" className="flex items-center">
              <img src={logoCC} alt="Connect Cidade" className="h-9" />
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
          <Loader2 className="h-6 w-6 animate-spin text-[#3cb478]" />
        </div>
      </div>
    )
  }

  if (tokenStatus === 'invalido') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
            <Link to="/" className="flex items-center">
              <img src={logoCC} alt="Connect Cidade" className="h-9" />
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white px-8 py-8 shadow-sm text-center">
            <p className="font-semibold text-[#2a2a2a]">Link inválido ou expirado</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/55">Este link não é mais válido. Solicite um novo para redefinir sua senha.</p>
            <Link
              to="/esqueci-senha"
              className="mt-6 inline-block w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] transition-colors"
            >
              Solicitar novo link
            </Link>
            <Link to="/login" className="mt-4 block text-sm text-[#3cb478] font-medium hover:underline">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
            <Link to="/" className="flex items-center">
              <img src={logoCC} alt="Connect Cidade" className="h-9" />
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10 text-center">
            <img src={iconCC} alt="" className="h-14 mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#2a2a2a]">Senha alterada</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/55">Você já pode entrar com a nova senha.</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="mt-8 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] transition-colors"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <Link to="/login" className="text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">
          <div className="mb-8 text-center">
            <img src={iconCC} alt="Connect Cidade" className="h-14 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-[#2a2a2a] tracking-tight">Nova senha</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">Defina uma senha forte para sua conta.</p>
          </div>

          <form onSubmit={(e) => void salvar(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarNova ? 'text' : 'password'}
                  value={senhaNova}
                  onChange={(e) => {
                    setSenhaNova(e.target.value)
                    setErros((p) => ({ ...p, senha_nova: '', confirmar_senha: '' }))
                    setErroApi('')
                  }}
                  onBlur={() => blur('senha_nova')}
                  placeholder="••••••••"
                  className={classeInput(erros.senha_nova) + ' pr-12'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNova((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
                >
                  {mostrarNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {senhaNova.length > 0 && (() => {
                const pontos = avaliarForca(senhaNova)
                const { label, cor, largura } = infoForca(pontos)
                const corTexto =
                  pontos <= 2 ? 'text-red-500' : pontos <= 4 ? 'text-amber-600' : 'text-[#2a7a4a]'
                return (
                  <div className="mt-1.5">
                    <div className="h-1.5 w-full rounded-full bg-[#2a2a2a]/10">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${cor} ${largura}`} />
                    </div>
                    <p className={`mt-0.5 text-xs ${corTexto}`}>{label}</p>
                  </div>
                )
              })()}
              {erros.senha_nova && <p className="text-xs text-red-500 mt-0.5">{erros.senha_nova}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Confirmar senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={senhaConfirmar}
                  onChange={(e) => {
                    setSenhaConfirmar(e.target.value)
                    setErros((p) => ({ ...p, confirmar_senha: '' }))
                    setErroApi('')
                  }}
                  onBlur={() => blur('confirmar_senha')}
                  placeholder="••••••••"
                  className={classeInput(erros.confirmar_senha) + ' pr-12'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
                >
                  {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {erros.confirmar_senha && (
                <p className="text-xs text-red-500 mt-0.5">{erros.confirmar_senha}</p>
              )}
            </div>

            {erroApi && <p className="text-sm text-red-500 text-center">{erroApi}</p>}

            <button
              type="submit"
              disabled={carregando || !formularioValido}
              className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregando ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-4 block w-full py-3 rounded-xl border border-[#2a2a2a]/12 bg-white text-center text-sm font-medium text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
