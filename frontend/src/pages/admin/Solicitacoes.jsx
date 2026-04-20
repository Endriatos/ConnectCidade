import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp, Clock, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import MapaMini from '../../components/admin/MapaMini'
import ModalGerenciarSolicitacao from '../../components/admin/ModalGerenciarSolicitacao'
import AdminSolicitacoesTable from '../../components/admin/AdminSolicitacoesTable'
import { STATUS_LABEL, STATUS_ICONE, formatarData } from '../../utils/solicitacaoStatus'
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
  const [toast, setToast] = useState(null)
  const [meuIdUsuario, setMeuIdUsuario] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then((res) => setMeuIdUsuario(res.data.id_usuario)).catch(() => {})
  }, [])

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
  }

  const fecharModal = () => {
    setSelecionada(null)
  }

  const temFiltroAtivo = protocolo || endereco || idCategoria || status || dataInicio || dataFim

  const handlePinClick = useCallback((proto) => {
    setProtocolo(proto)
    buscar(1, proto)
  }, [buscar])

  const onTabelaRowClick = (item) => {
    if (item.status !== 'RESOLVIDO' && item.status !== 'CANCELADO' && focoSolicitacao?.id !== item.id_solicitacao) {
      setFocoSolicitacao({ id: item.id_solicitacao, lat: item.latitude, lng: item.longitude })
    }
  }

  const onTabelaGerenciar = (item) => {
    if (item.status !== 'RESOLVIDO' && item.status !== 'CANCELADO' && focoSolicitacao?.id !== item.id_solicitacao) {
      setFocoSolicitacao({ id: item.id_solicitacao, lat: item.latitude, lng: item.longitude })
    }
    abrirModal(item)
  }

  const tabelaRowClassName = (item) =>
    `transition-colors cursor-pointer hover:bg-[#2a2a2a]/2 ${
      focoSolicitacao?.id === item.id_solicitacao
        ? 'border-l-2 border-l-[#3cb478]'
        : ''
    }`

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
            <AdminSolicitacoesTable
              itens={itens}
              categoriasPorId={catMap}
              showSolicitante
              onRowClick={onTabelaRowClick}
              onGerenciarClick={onTabelaGerenciar}
              rowClassName={tabelaRowClassName}
            />

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

      {selecionada !== null && (
        <ModalGerenciarSolicitacao
          preview={selecionada}
          categorias={categorias}
          meuIdUsuario={meuIdUsuario}
          onClose={fecharModal}
          onSucessoStatus={(nova) => {
            setItens((prev) =>
              prev.map((i) => (i.id_solicitacao === nova.id_solicitacao ? nova : i))
            )
            carregarFila()
            setToast({ tipo: 'sucesso', mensagem: 'Status atualizado com sucesso.' })
          }}
          onFeedbackErro={(detalhe) => setToast({ tipo: 'erro', mensagem: detalhe })}
        />
      )}

      {/* Toast */}
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

