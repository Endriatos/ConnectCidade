import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import api from '../services/api'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'

export default function VerificarEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verificando')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('invalido')
      return
    }
    api.get(`/auth/verificar-email?token=${token}`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('invalido'))
  }, [searchParams])

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

          {status === 'verificando' && (
            <>
              <Loader2 className="h-10 w-10 text-[#3cb478] mx-auto mb-4 animate-spin" />
              <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Verificando seu e-mail...</p>
              <p className="mt-3 text-sm text-[#2a2a2a]/55">Aguarde um momento.</p>
            </>
          )}

          {status === 'ok' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-[#3cb478] mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">E-mail confirmado!</p>
              <p className="mt-3 text-sm text-[#2a2a2a]/55 leading-relaxed">
                Sua conta foi ativada com sucesso. Você já pode fazer login.
              </p>
              <Link
                to="/login"
                className="mt-8 block w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all text-center"
              >
                Ir para o login
              </Link>
            </>
          )}

          {status === 'invalido' && (
            <>
              <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Link inválido ou expirado</p>
              <p className="mt-3 text-sm text-[#2a2a2a]/55 leading-relaxed">
                Este link de confirmação não é válido ou já expirou.
              </p>
              <Link
                to="/login"
                className="mt-8 block w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all text-center"
              >
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
