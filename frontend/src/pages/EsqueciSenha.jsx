import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import api from '../services/api'
import { classeInput, mensagemErroApi } from '../utils/meuPerfilForm'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'

function formatarCpf(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCpf(v) {
  const t = v.replace(/\D/g, '')
  if (!t) return 'CPF é obrigatório.'
  if (t.length !== 11) return 'CPF inválido.'
  return ''
}

export default function EsqueciSenha() {
  const [cpf, setCpf] = useState('')
  const [erroCampo, setErroCampo] = useState('')
  const [erroApi, setErroApi] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    setErroApi('')
    setMensagemSucesso('')
    const msg = validarCpf(cpf)
    setErroCampo(msg)
    if (msg) return

    setCarregando(true)
    try {
      await api.post('/auth/recuperar-senha', { cpf: cpf.replace(/\D/g, '') })
      setMensagemSucesso(
        'Se houver uma conta com esse CPF, enviaremos o link de redefinição para o e-mail cadastrado. Confira a caixa de entrada e o spam.',
      )
      setCpf('')
    } catch (err) {
      setErroApi(mensagemErroApi(err))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">
          <div className="mb-8 text-center">
            <img src={iconCC} alt="Connect Cidade" className="h-14 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-[#2a2a2a] tracking-tight">Esqueci a senha</p>
            {!mensagemSucesso && (
              <p className="mt-2 text-sm text-[#2a2a2a]/50 leading-relaxed">Digite seu CPF cadastrado.</p>
            )}
          </div>

          {mensagemSucesso ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-[#3cb478]/10 px-4 py-3 text-sm font-medium text-[#2a7a4a] leading-relaxed">
                {mensagemSucesso}
              </p>
              <Link
                to="/login"
                className="block w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm text-center hover:bg-[#349d69] active:scale-[0.98] transition-all"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">CPF</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatarCpf(e.target.value))
                    setErroCampo('')
                    setErroApi('')
                  }}
                  onBlur={() => setErroCampo(validarCpf(cpf))}
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  className={classeInput(erroCampo)}
                />
                {erroCampo && <p className="text-xs text-red-500 mt-0.5">{erroCampo}</p>}
              </div>
              {erroApi && <p className="text-sm text-red-500 text-center">{erroApi}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                {carregando ? 'Enviando...' : 'Enviar link'}
              </button>
              <p className="mt-2 text-center text-sm text-[#2a2a2a]/40">
                <Link to="/login" className="text-[#3cb478] font-medium hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
