import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MailCheck } from 'lucide-react'
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

export default function AguardandoVerificacao() {
  const [cpf, setCpf] = useState('')
  const [erroCampo, setErroCampo] = useState('')
  const [erroApi, setErroApi] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [reenviadoOk, setReenviadoOk] = useState(false)

  const reenviar = async (e) => {
    e.preventDefault()
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setErroCampo('CPF inválido.')
      return
    }
    setErroCampo('')
    setErroApi('')
    setCarregando(true)
    try {
      await api.post('/auth/reenviar-verificacao', { cpf: cpfLimpo })
      setReenviadoOk(true)
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
          <Link to="/login" className="text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10 text-center">
          <img src={iconCC} alt="" className="h-14 mx-auto mb-4" />
          <MailCheck className="h-10 w-10 text-[#3cb478] mx-auto mb-4" />
          <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Confirme seu e-mail</p>
          <p className="mt-3 text-sm text-[#2a2a2a]/55 leading-relaxed">
            Enviamos um link de confirmação para o seu e-mail. Acesse sua caixa de entrada e clique no botão para ativar sua conta.
          </p>
          <p className="mt-2 text-xs text-[#2a2a2a]/35">Não esqueça de verificar o spam.</p>

          <div className="mt-8 border-t border-[#2a2a2a]/8 pt-6">
            <p className="text-sm text-[#2a2a2a]/50 mb-4">Não recebeu o e-mail?</p>

            {reenviadoOk ? (
              <p className="rounded-xl bg-[#3cb478]/10 px-4 py-3 text-sm font-medium text-[#2a7a4a]">
                E-mail reenviado! Verifique sua caixa de entrada.
              </p>
            ) : (
              <form onSubmit={(e) => void reenviar(e)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">CPF</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => { setCpf(formatarCpf(e.target.value)); setErroCampo(''); setErroApi('') }}
                    placeholder="000.000.000-00"
                    autoComplete="off"
                    className={classeInput(erroCampo)}
                  />
                  {erroCampo && <p className="text-xs text-red-500">{erroCampo}</p>}
                </div>
                {erroApi && <p className="text-sm text-red-500 text-center">{erroApi}</p>}
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {carregando ? 'Enviando...' : 'Reenviar e-mail'}
                </button>
              </form>
            )}
          </div>

          <Link to="/login" className="mt-6 block text-sm text-[#3cb478] font-medium hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
