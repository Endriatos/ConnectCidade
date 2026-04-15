import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp, Clock, RefreshCw, MapPin, Calendar, ChevronDown, User, ExternalLink } from 'lucide-react'
import Lottie from 'lottie-react'
import typing from '../../assets/Typing.json'
import api from '../../services/api'
import MapaMini from '../../components/admin/MapaMini'
import Timeline from '../../components/minhasSolicitacoes/timeline/Timeline'
import {
  STATUS_LABEL,
  STATUS_ICONE,
  formatarData,
  construirEventosTimeline,
  marcarUltimaAvaliacaoComoEtapaAtual,
  obterUltimoStatusNosEventos,
  marcarComoAtualUltimoEventoComEsseStatus,
} from '../../utils/solicitacaoStatus'
import { iconeCategoria } from '../../utils/categoriaIcone'

function tempoDesde(iso) {
  if (!iso) return '0min'
  const ms = Math.max(0, Date.now() - new Date(iso).getTime())
  const dias = Math.floor(ms / 86400000)
  if (dias > 0) return `${dias}d`
  const horas = Math.floor(ms / 3600000)
  if (horas > 0) {
    const mins = Math.floor((ms % 3600000) / 60000)
    return `${horas}h ${mins}min`
  }
  return `${Math.floor(ms / 60000)}min`
}

const STATUS_OPCOES = [
  { valor: '', label: 'Todos os status' },
  { valor: 'PENDENTE', label: 'Pendente' },
  { valor: 'EM_ANALISE', label: 'Em análise' },
  { valor: 'EM_ANDAMENTO', label: 'Em andamento' },
  { valor: 'RESOLVIDO', label: 'Resolvido' },
  { valor: 'CANCELADO', label: 'Cancelado' },
]

const inputCls = 'h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30 w-full'

export default function Solicitacoes() {
  const [fila, setFila] = useState([])

  const [categorias, setCategorias] = useState([])
  const [itens, setItens] = useState([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [buscaRealizada, setBuscaRealizada] = useState(false)

  const [protocolo, setProtocolo] = useState('')
  const [endereco, setEndereco] = useState('')
  const [idCategoria, setIdCategoria] = useState('')
  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [ocultarEncerradas, setOcultarEncerradas] = useState(true)

  const [focoSolicitacao, setFocoSolicitacao] = useState(null)
  const [selecionada, setSelecionada] = useState(null)
  const [fotosModal, setFotosModal] = useState([])
  const [carregandoFotos, setCarregandoFotos] = useState(false)
  const [fotoAtiva, setFotoAtiva] = useState(null)
  const [statusNovo, setStatusNovo] = useState('')
  const [comentario, setComentario] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const [erroModal, setErroModal] = useState('')
  const [toast, setToast] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [carregandoTimeline, setCarregandoTimeline] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [modalEmBreve, setModalEmBreve] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const [filaAtualizada, setFilaAtualizada] = useState(false)

  const carregarFila = useCallback((mostrarFeedback = false) => {
    api.get('/admin/dashboard/fila-atencao')
      .then((res) => {
        setFila(res.data)
        if (mostrarFeedback) {
          setFilaAtualizada(true)
          setTimeout(() => setFilaAtualizada(false), 2500)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {})
    carregarFila()
  }, [carregarFila])

  useEffect(() => {
    buscar(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const catMap = Object.fromEntries(categorias.map((c) => [c.id_categoria, c]))

  const buscar = useCallback((pag = 1, protocoloOverride = null) => {
    setCarregando(true)
    setBuscaRealizada(true)
    const params = new URLSearchParams()
    const protocoloAtivo = protocoloOverride ?? protocolo
    if (protocoloAtivo) {
      const semHash = protocoloAtivo.replace(/^#/, '')
      const normalizado = /^\d{8,9}$/.test(semHash.replace(/-/g, ''))
        ? semHash.replace(/-/g, '').replace(/^(\d{4})(\d+)$/, '$1-$2')
        : semHash
      params.set('protocolo', normalizado)
    }
    if (endereco) params.set('endereco', endereco)
    if (idCategoria) params.set('id_categoria', idCategoria)
    if (status) params.set('status', status)
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
    if (ocultarEncerradas) params.set('ocultar_encerradas', 'true')
    params.set('pagina', pag)
    params.set('por_pagina', 20)

    api.get(`/admin/solicitacoes?${params}`)
      .then((res) => {
        setItens(res.data.itens)
        setTotal(res.data.total)
        setPaginas(res.data.paginas)
        setPagina(pag)
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [protocolo, endereco, idCategoria, status, dataInicio, dataFim, ocultarEncerradas])

  const handleSubmitFiltros = (e) => {
    e.preventDefault()
    buscar(1)
  }

  const limparFiltros = () => {
    setProtocolo('')
    setEndereco('')
    setIdCategoria('')
    setStatus('')
    setDataInicio('')
    setDataFim('')
    setOcultarEncerradas(false)
  }

  const abrirModal = (item) => {
    setSelecionada(item)
    setStatusNovo(item.status)
    setComentario('')
    setErroModal('')
    setFotosModal([])
    setTimeline([])
    setHistoricoAberto(false)
    setCarregandoFotos(true)
    setCarregandoTimeline(true)
    api.get(`/admin/solicitacoes/${item.id_solicitacao}`)
      .then((res) => {
        setSelecionada(res.data)
        setStatusNovo(res.data.status)
      })
      .catch(() => {})
    api.get(`/solicitacoes/${item.id_solicitacao}/fotos`)
      .then((res) => setFotosModal(res.data))
      .catch(() => {})
      .finally(() => setCarregandoFotos(false))
    api.get(`/solicitacoes/${item.id_solicitacao}/timeline`)
      .then((res) => setTimeline(res.data))
      .catch(() => {})
      .finally(() => setCarregandoTimeline(false))
  }

  const fecharModal = () => {
    setSelecionada(null)
    setStatusNovo('')
    setComentario('')
    setErroModal('')
    setFotosModal([])
    setFotoAtiva(null)
    setTimeline([])
    setHistoricoAberto(false)
  }

  const handleAtualizarStatus = () => {
    if (!comentario.trim()) {
      setErroModal('O comentário é obrigatório.')
      return
    }
    setAtualizando(true)
    setErroModal('')
    api.patch(`/admin/solicitacoes/${selecionada.id_solicitacao}/status`, {
      status_novo: statusNovo,
      comentario: comentario.trim(),
    })
      .then((res) => {
        setItens((prev) =>
          prev.map((i) => (i.id_solicitacao === res.data.id_solicitacao ? res.data : i))
        )
        setSelecionada(res.data)
        setStatusNovo(res.data.status)
        setComentario('')
        setErroModal('')
        setCarregandoTimeline(true)
        api.get(`/solicitacoes/${res.data.id_solicitacao}/timeline`)
          .then((r) => setTimeline(r.data))
          .catch(() => {})
          .finally(() => setCarregandoTimeline(false))
        carregarFila()
        fecharModal()
        setToast({ tipo: 'sucesso', mensagem: 'Status atualizado com sucesso.' })
      })
      .catch((err) => {
        setErroModal(err?.response?.data?.detail ?? 'Erro ao atualizar status.')
        setToast({ tipo: 'erro', mensagem: err?.response?.data?.detail ?? 'Erro ao atualizar status.' })
      })
      .finally(() => setAtualizando(false))
  }

  const eventosTimeline = useMemo(() => {
    if (!selecionada || timeline === null) return []
    const eventosOrdenados = construirEventosTimeline(selecionada, timeline)
    const statusAtualNaSolicitacao = selecionada.status
    const statusMaisRecenteNoHistorico = obterUltimoStatusNosEventos(eventosOrdenados)
    const eventosComDestaqueDeStatus =
      statusMaisRecenteNoHistorico === statusAtualNaSolicitacao
        ? marcarComoAtualUltimoEventoComEsseStatus(eventosOrdenados, statusAtualNaSolicitacao)
        : eventosOrdenados
    return marcarUltimaAvaliacaoComoEtapaAtual(eventosComDestaqueDeStatus)
  }, [selecionada, timeline])

  const temFiltroAtivo = protocolo || endereco || idCategoria || status || dataInicio || dataFim

  const handlePinClick = useCallback((proto) => {
    setProtocolo(proto)
    buscar(1, proto)
  }, [buscar])

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Solicitações</h1>

      {/* Mapa + Precisa de atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden min-h-[480px]">
          <MapaMini focoSolicitacao={focoSolicitacao} onPinClick={handlePinClick} />
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/8 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#f97316]" />
              <h2 className="text-base font-semibold text-[#2a2a2a]">Precisa de atenção</h2>
            </div>
            {filaAtualizada ? (
              <span className="flex items-center gap-1.5 h-8 px-3 text-xs text-[#3cb478] animate-fade-in-up">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Atualizado
              </span>
            ) : (
              <button
                onClick={() => carregarFila(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                title="Atualizar fila"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            )}
          </div>

          {fila.length === 0 ? (
            <p className="text-sm text-[#2a2a2a]/40 py-4 text-center">Nenhuma solicitação em aberto.</p>
          ) : (
            <div className="flex flex-col justify-between flex-1 gap-1">
              {fila.map((item, idx) => {
                const Icone = iconeCategoria(item.nome_categoria)
                const IconeStatus = STATUS_ICONE[item.status]
                const tempo = tempoDesde(item.data_atualizacao || item.data_registro)
                return (
                  <div
                    key={item.id_solicitacao}
                    onClick={() => {
                      if (focoSolicitacao?.id !== item.id_solicitacao)
                        setFocoSolicitacao({ id: item.id_solicitacao, lat: item.latitude, lng: item.longitude })
                    }}
                    className={`w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border border-black/8 transition-colors cursor-pointer ${
                      focoSolicitacao?.id === item.id_solicitacao
                        ? 'border-l-[3px] border-l-[#3cb478] hover:bg-[#2a2a2a]/4'
                        : 'hover:bg-[#2a2a2a]/4'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:contents">
                      <span className="text-sm font-bold text-[#2a2a2a]/25 w-5 shrink-0 text-center">{idx + 1}</span>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-mono text-sm text-[#2a2a2a]/50 shrink-0">#{item.protocolo}</span>
                          <span
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70"
                            style={{ borderColor: item.cor_hex }}
                          >
                            <Icone className="h-3.5 w-3.5 shrink-0" style={{ color: item.cor_hex }} />
                            {item.nome_categoria}
                          </span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70">
                            {IconeStatus && <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" />}
                            {STATUS_LABEL[item.status]}
                          </span>
                        </div>
                        <p className="text-sm text-[#2a2a2a]/40 truncate"><span className="mr-1">·</span>{item.descricao}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-sm text-[#2a2a2a]/40 self-end sm:self-auto">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
                        {item.contador_apoios}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{tempo}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirModal(item) }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                      >
                        Gerenciar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pesquisar */}
      <h2 className="text-base font-semibold text-[#2a2a2a] tracking-tight">Pesquisar</h2>
      <form
        onSubmit={handleSubmitFiltros}
        className="bg-white border border-black/8 rounded-2xl p-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            placeholder="Protocolo"
            className={inputCls}
          />
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
            className={inputCls}
          />
          <select
            value={idCategoria}
            onChange={(e) => setIdCategoria(e.target.value)}
            className={inputCls}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputCls}
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s.valor} value={s.valor}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-[#2a2a2a]/50 flex-wrap">
            <span className="shrink-0">Abertura:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60"
            />
            <span className="shrink-0">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#2a2a2a]/60">
            <input
              type="checkbox"
              checked={ocultarEncerradas}
              onChange={(e) => setOcultarEncerradas(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 cursor-pointer"
            />
            Ocultar encerradas
          </label>
          <div className="flex items-center gap-2 ml-auto">
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
          </div>
        </div>
      </form>

      {/* Lista */}
      <div className="bg-white border border-black/8 rounded-2xl overflow-hidden">
        {!buscaRealizada ? (
          <p className="text-sm text-[#2a2a2a]/40 text-center py-16">Selecione ao menos um filtro e clique em Buscar.</p>
        ) : carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#3cb478] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : itens.length === 0 ? (
          <p className="text-sm text-[#2a2a2a]/40 text-center py-16">Nenhuma solicitação encontrada.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-xs text-[#2a2a2a]/40 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Protocolo</th>
                    <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Endereço</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Data</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Apoios</th>
                    <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Solicitante</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {itens.map((item) => {
                    const cat = catMap[item.id_categoria]
                    const Icone = iconeCategoria(cat?.nome_categoria)
                    const IconeStatus = STATUS_ICONE[item.status]
                    return (
                      <tr
                        key={item.id_solicitacao}
                        onClick={() => {
                          if (item.status !== 'RESOLVIDO' && item.status !== 'CANCELADO' && focoSolicitacao?.id !== item.id_solicitacao)
                            setFocoSolicitacao({ id: item.id_solicitacao, lat: item.latitude, lng: item.longitude })
                        }}
                        className={`transition-colors cursor-pointer hover:bg-[#2a2a2a]/2 ${
                          focoSolicitacao?.id === item.id_solicitacao
                            ? 'border-l-2 border-l-[#3cb478]'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#2a2a2a]/60 w-px whitespace-nowrap">
                          #{item.protocolo}
                        </td>
                        <td className="px-4 py-3 w-px whitespace-nowrap">
                          {cat && (
                            <span
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70"
                              style={{ borderColor: cat.cor_hex }}
                            >
                              <Icone className="h-3.5 w-3.5 shrink-0" style={{ color: cat.cor_hex }} />
                              {cat.nome_categoria}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-px whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70">
                            {IconeStatus && <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" />}
                            {STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/60 hidden md:table-cell">
                          {item.endereco_referencia}
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/50 whitespace-nowrap hidden lg:table-cell">
                          {formatarData(item.data_registro)}
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/50 hidden lg:table-cell">
                          {item.contador_apoios}
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/60 hidden xl:table-cell">
                          {item.nome_autor ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.status !== 'RESOLVIDO' && item.status !== 'CANCELADO' && focoSolicitacao?.id !== item.id_solicitacao)
                                setFocoSolicitacao({ id: item.id_solicitacao, lat: item.latitude, lng: item.longitude })
                              abrirModal(item)
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                          >
                            Gerenciar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-black/8">
                <span className="text-xs text-[#2a2a2a]/40">
                  {total} resultado{total !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagina <= 1}
                    onClick={() => buscar(pagina - 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#2a2a2a]/40 hover:bg-[#2a2a2a]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-[#2a2a2a]/60 px-2">
                    {pagina} / {paginas}
                  </span>
                  <button
                    disabled={pagina >= paginas}
                    onClick={() => buscar(pagina + 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#2a2a2a]/40 hover:bg-[#2a2a2a]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de gerenciamento */}
      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="px-6 pt-5 pb-4 border-b border-black/8 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-[#2a2a2a]/40 mb-1">#{selecionada.protocolo}</p>
                  <p className="text-base font-semibold text-[#2a2a2a] leading-snug">{selecionada.descricao}</p>
                </div>
                <button
                  onClick={fecharModal}
                  className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0 mt-0.5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {(() => {
                  const cat = catMap[selecionada.id_categoria] ??
                    (selecionada.nome_categoria ? { nome_categoria: selecionada.nome_categoria, cor_hex: selecionada.cor_hex } : null)
                  const Icone = iconeCategoria(cat?.nome_categoria)
                  return cat ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1.5 text-sm font-medium text-[#2a2a2a]/70"
                      style={{ borderColor: cat.cor_hex }}
                    >
                      <Icone className="h-4 w-4 shrink-0" style={{ color: cat.cor_hex }} />
                      {cat.nome_categoria}
                    </span>
                  ) : null
                })()}
                {(() => {
                  const IconeStatus = STATUS_ICONE[selecionada.status]
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1.5 text-sm font-medium text-[#2a2a2a]/70">
                      {IconeStatus && <IconeStatus className="h-4 w-4 text-[#2a2a2a]/55" />}
                      {STATUS_LABEL[selecionada.status]}
                    </span>
                  )
                })()}
                <span className="inline-flex items-center gap-1.5 text-xs text-[#2a2a2a]/45">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatarData(selecionada.data_registro)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#2a2a2a]/45">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {selecionada.contador_apoios} apoio{selecionada.contador_apoios !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Corpo com scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* Solicitante */}
              <div className="px-6 py-3 border-b border-black/8">
                <button
                  type="button"
                  onClick={() => setModalEmBreve(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 hover:bg-[#2a2a2a]/4 transition-colors"
                >
                  <User className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
                  <span className="text-sm font-medium text-[#2a2a2a]/80">{selecionada.nome_autor ?? '—'}</span>
                </button>
              </div>
              {/* Localização */}
              <div className="px-6 py-4 space-y-2.5 border-b border-black/8">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-start gap-2 text-sm text-[#2a2a2a]/70">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{selecionada.endereco_referencia}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selecionada.latitude},${selecionada.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Mapa
                  </a>
                </div>
                <div className="font-mono text-xs text-[#2a2a2a]/40 pl-6">
                  {selecionada.latitude.toFixed(6)}, {selecionada.longitude.toFixed(6)}
                </div>
              </div>

              {/* Atualizar status */}
              <div className="px-6 py-5 space-y-4 border-b border-black/8">
                <p className="text-sm font-semibold text-[#2a2a2a]">Atualizar status</p>
                <div>
                  <label className="block text-xs font-medium text-[#2a2a2a]/60 mb-1.5">
                    Selecione o novo status
                  </label>
                  <select
                    value={statusNovo}
                    onChange={(e) => setStatusNovo(e.target.value)}
                    className={inputCls}
                  >
                    {STATUS_OPCOES.filter((s) => s.valor).map((s) => (
                      <option key={s.valor} value={s.valor}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2a2a2a]/60 mb-1.5">
                    Comentário <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    placeholder="Descreva a ação tomada ou justifique a mudança de status..."
                    className="w-full px-3 py-2.5 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30"
                  />
                </div>
                {erroModal && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {erroModal}
                  </p>
                )}
              </div>

              {/* Fotos */}
              {(carregandoFotos || fotosModal.length > 0) && (
                <div className="py-4 border-b border-black/8">
                  <p className="text-sm font-semibold text-[#2a2a2a] mb-3 px-6">Fotos</p>
                  {carregandoFotos ? (
                    <div className="flex gap-3 px-6 overflow-x-auto">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="shrink-0 w-24 h-24 rounded-xl bg-black/5 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 px-6 overflow-x-auto pb-1">
                      {fotosModal.map((foto, idx) => (
                        <img
                          key={foto.id_foto}
                          src={foto.caminho_arquivo}
                          alt={`Foto ${idx + 1}`}
                          className="shrink-0 w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFotoAtiva(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Histórico */}
              <div className="border-t border-black/8">
                <button
                  type="button"
                  onClick={() => setHistoricoAberto((v) => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#2a2a2a] hover:bg-[#2a2a2a]/3 transition-colors"
                >
                  Histórico
                  <ChevronDown className={`h-4 w-4 text-[#2a2a2a]/40 transition-transform duration-200 ${historicoAberto ? 'rotate-180' : ''}`} />
                </button>
                {historicoAberto && (
                  <div className="px-6 pb-5">
                    {carregandoTimeline ? (
                      <div className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-5 h-5 rounded-full bg-black/8 animate-pulse shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-24 rounded bg-black/8 animate-pulse" />
                              <div className="h-4 w-32 rounded bg-black/8 animate-pulse" />
                              <div className="h-3 w-48 rounded bg-black/8 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Timeline eventos={eventosTimeline} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div className="px-6 py-4 border-t border-black/8 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={fecharModal}
                className="h-9 px-4 rounded-xl text-sm text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAtualizarStatus}
                disabled={atualizando}
                className="h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-60 disabled:pointer-events-none transition-colors"
              >
                {atualizando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Lightbox */}
          {fotoAtiva !== null && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/70"
              onClick={() => setFotoAtiva(null)}
            >
              <div
                className="relative bg-black/90 mx-6 rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  onClick={() => setFotoAtiva(null)}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative flex items-center justify-center">
                  {fotoAtiva > 0 && (
                    <button
                      className="absolute left-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                      onClick={() => setFotoAtiva(fotoAtiva - 1)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  <img
                    src={fotosModal[fotoAtiva].caminho_arquivo}
                    alt={`Foto ${fotoAtiva + 1}`}
                    className="max-h-[70vh] max-w-[85vw] object-contain"
                  />
                  {fotoAtiva < fotosModal.length - 1 && (
                    <button
                      className="absolute right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                      onClick={() => setFotoAtiva(fotoAtiva + 1)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {fotosModal.length > 1 && (
                  <div className="flex justify-center gap-1.5 py-3">
                    {fotosModal.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${idx === fotoAtiva ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {/* Modal em breve */}
      {modalEmBreve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalEmBreve(false)}>
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-sm text-center mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-40 h-40 mx-auto">
              <Lottie animationData={typing} loop />
            </div>
            <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight mt-2">Coisas boas estão chegando!</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">Esta funcionalidade ainda está sendo desenvolvida.</p>
            <button
              onClick={() => setModalEmBreve(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-60 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up ${
          toast.tipo === 'sucesso'
            ? 'bg-[#2a2a2a] text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.tipo === 'sucesso' ? (
            <svg className="h-4 w-4 shrink-0 text-[#3cb478]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.mensagem}
        </div>
      )}
    </div>
  )
}
