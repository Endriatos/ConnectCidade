import { createElement, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Loader2, MapPin } from 'lucide-react'
import Header from '../components/Header'
import Timeline from '../components/minhasSolicitacoes/timeline/Timeline'
import api from '../services/api'
import { iconeCategoria } from '../utils/categoriaIcone'
import {
  PROXIMO_PASSO_STATUS,
  RESUMO_STATUS,
  STATUS_COR,
  STATUS_ESTILO,
  STATUS_LABEL,
  construirEventosPrevistos,
  formatarDataHora,
  montarEventosTimeline,
} from '../utils/solicitacaoStatus'

export default function DetalheMinhaSolicitacao() {
  const { idSolicitacao } = useParams()
  const navigate = useNavigate()
  const [categoriasPorId, setCategoriasPorId] = useState({})
  const [solicitacao, setSolicitacao] = useState(null)
  const [atualizacoes, setAtualizacoes] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api
      .get('/categorias')
      .then((res) => {
        const map = {}
        for (const c of res.data) {
          map[c.id_categoria] = c
        }
        setCategoriasPorId(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancel = false
    const run = async () => {
      await Promise.resolve()
      if (cancel) return
      setCarregando(true)
      setErro(null)
      setSolicitacao(null)
      setAtualizacoes(null)
      try {
        const [resSol, resTime] = await Promise.all([
          api.get(`/solicitacoes/${idSolicitacao}`),
          api.get(`/solicitacoes/${idSolicitacao}/timeline`),
        ])
        if (cancel) return
        setSolicitacao(resSol.data)
        setAtualizacoes(resTime.data)
      } catch {
        if (!cancel) setErro('Não foi possível carregar esta solicitação.')
      } finally {
        if (!cancel) setCarregando(false)
      }
    }
    void run()
    return () => {
      cancel = true
    }
  }, [idSolicitacao])

  const eventos = useMemo(() => {
    if (!solicitacao || atualizacoes === null) return []
    const reais = montarEventosTimeline(solicitacao, atualizacoes)
    if (atualizacoes.length > 0) return reais
    return [...reais, ...construirEventosPrevistos(solicitacao.status)]
  }, [solicitacao, atualizacoes])

  if (carregando) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-10 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3cb478]" />
          <p className="text-sm text-[#2a2a2a]/50">Carregando detalhes…</p>
        </main>
      </div>
    )
  }

  if (erro || !solicitacao) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-10">
          <div className="rounded-2xl border border-black/8 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#2a2a2a]/70">{erro ?? 'Solicitação não encontrada.'}</p>
            <button
              type="button"
              onClick={() => navigate('/minhas-solicitacoes')}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a lista
            </button>
          </div>
        </main>
      </div>
    )
  }

  const cat = categoriasPorId[solicitacao.id_categoria]
  const estiloStatusAtual = STATUS_ESTILO[solicitacao.status]
  const statusCor = STATUS_COR[solicitacao.status] ?? '#2a2a2a'

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 pb-16">
          <button
            type="button"
            onClick={() => navigate('/minhas-solicitacoes')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#2a2a2a]/55 hover:text-[#2a2a2a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Minhas solicitações
          </button>

          <div className="space-y-6">
            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold text-[#2a2a2a]">
                Detalhes da solicitação
              </h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                    Protocolo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2a2a2a] tabular-nums">
                    {`#${solicitacao.protocolo}`}
                  </p>
                </div>
                {cat && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                      Categoria
                    </p>
                    <span
                      className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={{
                        color: cat.cor_hex,
                        borderColor: `${cat.cor_hex}55`,
                        backgroundColor: `${cat.cor_hex}15`,
                      }}
                    >
                      {createElement(iconeCategoria(cat?.nome_categoria), {
                        className: 'h-3.5 w-3.5',
                      })}
                      {cat.nome_categoria}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                Descrição
              </p>
              <p className="mt-4 text-sm text-[#2a2a2a]/70 leading-relaxed whitespace-pre-wrap">
                {solicitacao.descricao}
              </p>
              <div className="mt-4 flex items-start gap-2 text-sm text-[#2a2a2a]/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#2a2a2a]/35" />
                <span>{solicitacao.endereco_referencia}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold text-[#2a2a2a]">
                Panorama do andamento
              </h2>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-black/6 bg-[#f5f5f5]/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                    Situação atual
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: estiloStatusAtual?.bg ?? `${statusCor}22`,
                        color: estiloStatusAtual?.text ?? statusCor,
                        borderColor: estiloStatusAtual?.border ?? `${statusCor}40`,
                      }}
                    >
                      {STATUS_LABEL[solicitacao.status] ?? solicitacao.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#2a2a2a]/70 leading-relaxed">
                    {RESUMO_STATUS[solicitacao.status] ?? 'Status em atualização.'}
                  </p>
                </section>

                <section className="rounded-xl border border-black/6 bg-[#f5f5f5]/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                    Próximo passo esperado
                  </p>
                  <p className="mt-2 text-sm text-[#2a2a2a]/70 leading-relaxed">
                    {PROXIMO_PASSO_STATUS[solicitacao.status] ?? 'Acompanhe o histórico para novas atualizações.'}
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-xs text-[#2a2a2a]/45">
                    <Calendar className="h-3.5 w-3.5 text-[#2a2a2a]/35" />
                    Registrada em {formatarDataHora(solicitacao.data_registro)}
                  </p>
                </section>
              </div>
            </div>

            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold text-[#2a2a2a]">
                Histórico completo
              </h2>
              <p className="mt-1 text-sm text-[#2a2a2a]/50">
                Histórico de status e comentários da prefeitura.
              </p>
              <div className="mt-8">
                <Timeline eventos={eventos} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
