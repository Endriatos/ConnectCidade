import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react'
import Header from '../components/Header'
import Carregando from '../components/minhasSolicitacoes/card/Carregando'
import Erro from '../components/minhasSolicitacoes/card/Erro'
import Timeline from '../components/minhasSolicitacoes/timeline/Timeline'
import api from '../services/api'
import { iconeCategoria } from '../utils/categoriaIcone'
import {
  COR_MARCADOR_HISTORICO,
  RESUMO_STATUS,
  STATUS_ICONE,
  STATUS_LABEL,
  destacarUltimoEventoComStatusIgual,
  formatarDataHora,
  montarEventosTimeline,
  ultimoCodigoStatusNaTimeline,
} from '../utils/solicitacaoStatus'

const MENSAGEM_ERRO_DETALHE = 'Não foi possível carregar esta solicitação.'

function PaginaMinhasEnvoltorio({ children, paddingBottom }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex-1">
        <div
          className={
            paddingBottom
              ? 'mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-6 pb-16 sm:px-6'
              : 'mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-6 sm:px-6'
          }
        >
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DetalheMinhaSolicitacao() {
  const { idSolicitacao } = useParams()
  const navigate = useNavigate()
  const [categoriasPorId, setCategoriasPorId] = useState({})
  const [solicitacao, setSolicitacao] = useState(null)
  const [atualizacoes, setAtualizacoes] = useState(null)
  const [fotos, setFotos] = useState([])
  const [fotoAtiva, setFotoAtiva] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [notaAvaliacao, setNotaAvaliacao] = useState(null)
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('')
  const [problemaResolvido, setProblemaResolvido] = useState(null)
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)
  const [erroAvaliacao, setErroAvaliacao] = useState(null)
  const [versaoCarga, setVersaoCarga] = useState(0)

  useEffect(() => {
    api
      .get('/categorias')
      .then((res) => {
        setCategoriasPorId(
          Object.fromEntries(res.data.map((c) => [c.id_categoria, c])),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancel = false
    let redirecionarSessao = false
    const executar = async () => {
      setCarregando(true)
      setErro(null)
      setSolicitacao(null)
      setAtualizacoes(null)
      setFotos([])
      try {
        const [resSol, resTime, resFotos] = await Promise.all([
          api.get(`/solicitacoes/${idSolicitacao}`),
          api.get(`/solicitacoes/${idSolicitacao}/timeline`),
          api.get(`/solicitacoes/${idSolicitacao}/fotos`).catch(() => ({ data: [] })),
        ])
        if (cancel) return
        setSolicitacao(resSol.data)
        setAtualizacoes(resTime.data)
        setFotos(Array.isArray(resFotos.data) ? resFotos.data : [])
      } catch (e) {
        if (e?.message === 'sessao_expirada' || e?.response?.status === 401) {
          redirecionarSessao = true
          return
        }
        if (!cancel) setErro(MENSAGEM_ERRO_DETALHE)
      } finally {
        if (!cancel && !redirecionarSessao) setCarregando(false)
      }
    }
    void executar()
    return () => {
      cancel = true
    }
  }, [idSolicitacao, versaoCarga])

  useEffect(() => {
    setNotaAvaliacao(null)
    setComentarioAvaliacao('')
    setProblemaResolvido(null)
    setErroAvaliacao(null)
    setEnviandoAvaliacao(false)
  }, [idSolicitacao])

  useEffect(() => {
    if (fotoAtiva === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setFotoAtiva(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fotoAtiva])

  const eventos = useMemo(() => {
    if (!solicitacao || atualizacoes === null) return []
    const base = montarEventosTimeline(solicitacao, atualizacoes)
    const st = solicitacao.status
    const label = STATUS_LABEL[st] ?? st
    const ultimo = ultimoCodigoStatusNaTimeline(base)
    if (ultimo === st) {
      return destacarUltimoEventoComStatusIgual(base, st)
    }
    return [
      ...base,
      {
        key: `onde-esta-${solicitacao.id_solicitacao}`,
        tipo: 'situacao_atual',
        estado: 'atual',
        data: null,
        dataLabel: 'Situação atual',
        titulo: label,
        descricao: RESUMO_STATUS[st] ?? 'Status neste momento.',
        autor: null,
        cor: COR_MARCADOR_HISTORICO,
        status: st,
      },
    ]
  }, [solicitacao, atualizacoes])

  if (carregando) {
    return (
      <PaginaMinhasEnvoltorio>
        <h1 className="text-2xl font-semibold text-[#2a2a2a]">Detalhes da solicitação</h1>
        <Carregando />
      </PaginaMinhasEnvoltorio>
    )
  }

  if (erro || !solicitacao) {
    return (
      <PaginaMinhasEnvoltorio>
        <h1 className="text-2xl font-semibold text-[#2a2a2a]">Detalhes da solicitação</h1>
        <Erro
          mensagem={erro ?? 'Solicitação não encontrada.'}
          onTentarNovamente={() => setVersaoCarga((v) => v + 1)}
        />
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => navigate('/minhas-solicitacoes')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a lista
          </button>
        </div>
      </PaginaMinhasEnvoltorio>
    )
  }

  const cat = categoriasPorId[solicitacao.id_categoria]
  const IconeStatus = STATUS_ICONE[solicitacao.status] ?? Circle
  const labelStatus = STATUS_LABEL[solicitacao.status] ?? solicitacao.status
  const nApoios = solicitacao.contador_apoios ?? 0
  const lat = Number(solicitacao.latitude)
  const lon = Number(solicitacao.longitude)
  const linkMapa =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? `https://www.google.com/maps?q=${lat},${lon}`
      : null
  const corCategoria = cat?.cor_hex ?? '#3cb478'
  const nomeCategoria = cat?.nome_categoria
  const IconeCategoria = iconeCategoria(nomeCategoria)
  const mostrarUltimaAtualizacao =
    solicitacao.status !== 'PENDENTE' && solicitacao.status !== 'RESOLVIDO'
  const mostrarDataResolucao = solicitacao.status === 'RESOLVIDO'

  const podeEnviarAvaliacao =
    notaAvaliacao != null &&
    comentarioAvaliacao.trim().length > 0 &&
    problemaResolvido !== null

  const enviarAvaliacao = async () => {
    if (!podeEnviarAvaliacao) return
    setErroAvaliacao(null)
    setEnviandoAvaliacao(true)
    try {
      await api.post(`/avaliacoes/${idSolicitacao}`, {
        foi_resolvido: problemaResolvido,
        nota: notaAvaliacao,
        comentario: comentarioAvaliacao.trim(),
      })
      const res = await api.get(`/solicitacoes/${idSolicitacao}`)
      setSolicitacao(res.data)
      setNotaAvaliacao(null)
      setComentarioAvaliacao('')
      setProblemaResolvido(null)
    } catch (e) {
      const d = e?.response?.data?.detail
      setErroAvaliacao(typeof d === 'string' ? d : 'Não foi possível enviar a avaliação.')
    } finally {
      setEnviandoAvaliacao(false)
    }
  }

  return (
    <PaginaMinhasEnvoltorio paddingBottom>
          <div>
            <h1 className="text-2xl font-semibold text-[#2a2a2a]">Detalhes da solicitação</h1>
            <p className="mt-1 min-w-0 text-lg font-semibold tabular-nums leading-none text-[#2a2a2a]">
              {`#${solicitacao.protocolo}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/minhas-solicitacoes')}
            className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#2a2a2a]/55 transition-colors hover:text-[#2a2a2a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a lista
          </button>

          <div className="space-y-6">
            <div className="rounded-xl border border-black/6 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
              <div className="flex min-w-0 flex-col gap-6">
                <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                      Categoria
                    </p>
                    <div className="mt-2">
                      {cat ? (
                        <span
                          className="inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-2.5 py-1 text-xs font-medium text-[#2a2a2a]/70"
                          style={{ borderColor: corCategoria }}
                        >
                          <IconeCategoria
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: corCategoria }}
                            aria-hidden
                          />
                          <span className="truncate">{nomeCategoria}</span>
                        </span>
                      ) : (
                        <p className="text-sm text-[#2a2a2a]/45">—</p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                          Status
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-2.5 py-1 text-xs font-medium text-[#2a2a2a]/70">
                            <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" aria-hidden />
                            {labelStatus}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 shrink-0 sm:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                          Apoios
                        </p>
                        <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums text-[#2a2a2a]/65 sm:justify-end">
                          <span
                            className="inline-flex items-center gap-1.5"
                            aria-label={`${nApoios} ${nApoios === 1 ? 'apoio' : 'apoios'}`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" aria-hidden />
                            <span>{nApoios}</span>
                          </span>
                          {solicitacao.ja_apoiado === true && (
                            <span className="text-xs font-medium text-[#3cb478]">Você apoiou</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 border-t border-black/[0.06] pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                    Descrição
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#2a2a2a]/70">
                    {solicitacao.descricao}
                  </p>
                </div>

                <div className="min-w-0 border-t border-black/[0.06] pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                    Localização
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-[#2a2a2a]/65">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40"
                      aria-hidden
                    />
                    <span className="min-w-0 break-words">{solicitacao.endereco_referencia}</span>
                  </p>
                  {linkMapa && (
                    <a
                      href={linkMapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Abrir local no mapa
                    </a>
                  )}
                </div>

                <div className="min-w-0 border-t border-black/[0.06] pt-6">
                  <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                        Data de abertura
                      </p>
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-[#2a2a2a]/70">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" aria-hidden />
                        <span>{formatarDataHora(solicitacao.data_registro)}</span>
                      </p>
                    </div>
                    {mostrarUltimaAtualizacao && (
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                          Última atualização
                        </p>
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-[#2a2a2a]/70">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" aria-hidden />
                          <span>{formatarDataHora(solicitacao.data_atualizacao)}</span>
                        </p>
                      </div>
                    )}
                    {mostrarDataResolucao && (
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                          Data de resolução
                        </p>
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-[#2a2a2a]/70">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" aria-hidden />
                          <span>
                            {solicitacao.data_resolucao
                              ? formatarDataHora(solicitacao.data_resolucao)
                              : '—'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-base font-semibold text-[#2a2a2a]">Fotos</h2>
              {fotos.length === 0 ? (
                <p className="mt-4 text-sm text-[#2a2a2a]/50">Nenhuma foto registrada nesta solicitação.</p>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {fotos.map((foto, idx) => (
                    <button
                      key={foto.id_foto}
                      type="button"
                      onClick={() => setFotoAtiva(idx)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-black/8 bg-[#f5f5f5] text-left outline-none ring-[#3cb478] transition-shadow focus-visible:ring-2"
                    >
                      <img
                        src={foto.caminho_arquivo}
                        alt={`Foto ${foto.ordem}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold text-[#2a2a2a]">Histórico</h2>
              <div className="mt-6">
                <Timeline eventos={eventos} />
              </div>
            </div>

            {solicitacao.status === 'RESOLVIDO' && (
              <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-base font-semibold text-[#2a2a2a]">Avaliação</h2>
                {solicitacao.ja_avaliado ? (
                  <div className="mt-4 space-y-2 text-sm leading-relaxed text-[#2a2a2a]/65">
                    <p>Obrigado pelo seu feedback — ele faz toda a diferença para a gente.</p>
                    <p className="text-[#2a2a2a]/55">
                      Suas respostas nos ajudam a entender o que está funcionando e o que podemos ajustar.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-[#2a2a2a]/50">
                      Avalie como foi o atendimento após a resolução.
                    </p>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                      Nota de 1 a 5
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNotaAvaliacao(n)}
                          className="inline-flex rounded-full p-0.5 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#3cb478]/25 focus-visible:ring-offset-2"
                          aria-label={`Nota ${n} de 5 estrelas`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              notaAvaliacao != null && n <= notaAvaliacao
                                ? 'fill-[#3cb478]/90 stroke-[#2a2a2a]/18'
                                : 'fill-none stroke-[#2a2a2a]/28'
                            }`}
                            strokeWidth={1}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                      Comentário
                    </p>
                    <textarea
                      value={comentarioAvaliacao}
                      onChange={(e) => setComentarioAvaliacao(e.target.value)}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-xl border border-black/8 bg-white px-3 py-2.5 text-sm text-[#2a2a2a] outline-none placeholder:text-[#2a2a2a]/35 focus:border-[#3cb478]/40 focus:ring-2 focus:ring-[#3cb478]/25"
                      placeholder="Descreva sua experiência com o atendimento"
                    />
                    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#2a2a2a]/40">
                      O problema foi realmente resolvido?
                    </p>
                    <div className="mt-3 flex flex-wrap gap-6">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#2a2a2a]">
                        <input
                          type="radio"
                          name={`problema-resolvido-${idSolicitacao}`}
                          checked={problemaResolvido === true}
                          onChange={() => setProblemaResolvido(true)}
                          className="h-4 w-4 border-black/20 text-[#3cb478] focus:ring-[#3cb478]"
                        />
                        Sim
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#2a2a2a]">
                        <input
                          type="radio"
                          name={`problema-resolvido-${idSolicitacao}`}
                          checked={problemaResolvido === false}
                          onChange={() => setProblemaResolvido(false)}
                          className="h-4 w-4 border-black/20 text-[#3cb478] focus:ring-[#3cb478]"
                        />
                        Não
                      </label>
                    </div>
                    {erroAvaliacao && (
                      <p className="mt-4 text-sm text-red-600">{erroAvaliacao}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => void enviarAvaliacao()}
                      disabled={!podeEnviarAvaliacao || enviandoAvaliacao}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#349d69] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#3cb478]"
                    >
                      {enviandoAvaliacao ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando avaliação…
                        </>
                      ) : (
                        'Avaliar'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

      {fotoAtiva !== null && fotos.length > 0 && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFotoAtiva(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] overflow-hidden rounded-xl bg-black/90 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Visualização da foto"
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
              onClick={() => setFotoAtiva(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative flex items-center justify-center px-10 py-8">
              {fotoAtiva > 0 && (
                <button
                  type="button"
                  className="absolute left-2 z-10 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                  onClick={() => setFotoAtiva(fotoAtiva - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <img
                src={fotos[fotoAtiva].caminho_arquivo}
                alt={`Foto ${fotoAtiva + 1}`}
                className="max-h-[70vh] max-w-[min(100vw-8rem,56rem)] object-contain"
              />
              {fotoAtiva < fotos.length - 1 && (
                <button
                  type="button"
                  className="absolute right-2 z-10 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                  onClick={() => setFotoAtiva(fotoAtiva + 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="flex justify-center gap-1.5 pb-3">
                {fotos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFotoAtiva(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === fotoAtiva ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                    aria-label={`Foto ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PaginaMinhasEnvoltorio>
  )
}
