import { useCallback, useEffect, useState } from 'react'
import { Loader2, Shield, User } from 'lucide-react'
import CardDadosPessoais from '../components/meuPerfil/CardDadosPessoais'
import CardEncerrarConta from '../components/cardEncerrarConta/CardEncerrarConta'
import CardSeguranca from '../components/meuPerfil/CardSeguranca'
import Header from '../components/Header'
import api from '../services/api'
import useAuthStore from '../store/authStore'

function iniciais(nome) {
  if (!nome?.trim()) return '?'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarDataCadastro(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function MeuPerfil() {
  const setNome = useAuthStore((s) => s.setNome)

  const [carregando, setCarregando] = useState(true)
  const [erroCarregar, setErroCarregar] = useState(null)
  const [servidor, setServidor] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroCarregar(null)
    try {
      const { data } = await api.get('/auth/me')
      setServidor(data)
    } catch (e) {
      if (e?.message === 'sessao_expirada') return
      setErroCarregar('Não foi possível carregar seu perfil.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const onServidorAtualizado = (data) => {
    setServidor(data)
    setNome(data.nome_usuario)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2a2a2a]">Meu perfil</h1>
            <p className="mt-0.5 text-sm text-[#2a2a2a]/50">Atualize seus dados e gerencie a segurança da conta.</p>
          </div>

          {carregando && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-black/8 bg-white py-20 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#3cb478]" />
              <p className="text-sm text-[#2a2a2a]/50">Carregando perfil…</p>
            </div>
          )}

          {!carregando && erroCarregar && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center shadow-sm">
              <p className="text-sm text-red-800">{erroCarregar}</p>
              <button
                type="button"
                onClick={() => void carregar()}
                className="mt-4 rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#349d69] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && servidor && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl font-semibold text-indigo-900">
                    {iniciais(servidor.nome_usuario)}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-lg font-semibold text-[#2a2a2a]">{servidor.nome_usuario}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {servidor.tipo_usuario === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#3cb478]/35 bg-[#3cb478]/10 px-3 py-1 text-xs font-medium text-[#2a7a4a]">
                          <Shield className="h-3.5 w-3.5" />
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a]/10 bg-[#2a2a2a]/5 px-3 py-1 text-xs font-medium text-[#2a2a2a]/70">
                          <User className="h-3.5 w-3.5" />
                          Cidadão
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-xs text-[#2a2a2a]/40">
                      Membro desde {formatarDataCadastro(servidor.data_cadastro)}
                    </p>
                  </div>
                </div>
              </div>

              <CardDadosPessoais servidor={servidor} onServidorAtualizado={onServidorAtualizado} />

              <CardSeguranca />

              <CardEncerrarConta />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
