import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp } from 'lucide-react'
import api from '../../services/api'
import MapaMini from '../../components/admin/MapaMini'
import { STATUS_LABEL, STATUS_ESTILO, STATUS_ICONE, formatarData } from '../../utils/solicitacaoStatus'
import { iconeCategoria } from '../../utils/categoriaIcone'

function diasDesde(iso) {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fila, setFila] = useState([])

  const [categorias, setCategorias] = useState([])
  const [itens, setItens] = useState([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [buscaRealizada, setBuscaRealizada] = useState(false)

  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') ?? '')
  const [endereco, setEndereco] = useState('')
  const [idCategoria, setIdCategoria] = useState('')
  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [selecionada, setSelecionada] = useState(null)
  const [statusNovo, setStatusNovo] = useState('')
  const [comentario, setComentario] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {})
    api.get('/admin/dashboard/fila-atencao').then((res) => setFila(res.data)).catch(() => {})
  }, [])

  const catMap = Object.fromEntries(categorias.map((c) => [c.id_categoria, c]))

  const buscar = useCallback((pag = 1) => {
    setCarregando(true)
    setBuscaRealizada(true)
    const params = new URLSearchParams()
    if (protocolo) params.set('protocolo', protocolo)
    if (endereco) params.set('endereco', endereco)
    if (idCategoria) params.set('id_categoria', idCategoria)
    if (status) params.set('status', status)
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
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
  }, [protocolo, endereco, idCategoria, status, dataInicio, dataFim])

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
  }

  const abrirModal = (item) => {
    setSelecionada(item)
    setStatusNovo(item.status)
    setComentario('')
    setErroModal('')
  }

  const fecharModal = () => {
    setSelecionada(null)
    setStatusNovo('')
    setComentario('')
    setErroModal('')
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
        fecharModal()
      })
      .catch((err) => {
        setErroModal(err?.response?.data?.detail ?? 'Erro ao atualizar status.')
      })
      .finally(() => setAtualizando(false))
  }

  const temFiltroAtivo = protocolo || endereco || idCategoria || status || dataInicio || dataFim

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Gerenciar</h1>

      {/* Mapa + Precisa de atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden min-h-[480px]">
          <MapaMini />
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/8 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#f97316]" />
            <h2 className="text-sm font-medium text-[#2a2a2a]">Precisa de atenção</h2>
          </div>

          {fila.length === 0 ? (
            <p className="text-sm text-[#2a2a2a]/40 py-4 text-center">Nenhuma solicitação em aberto.</p>
          ) : (
            <div className="flex flex-col justify-between flex-1 gap-1">
              {fila.map((item, idx) => {
                const Icone = iconeCategoria(item.nome_categoria)
                const IconeStatus = STATUS_ICONE[item.status]
                const dias = diasDesde(item.data_registro)
                return (
                  <button
                    key={item.id_solicitacao}
                    onClick={() => {
                      setProtocolo(item.protocolo)
                      window.scrollTo({ top: 9999, behavior: 'smooth' })
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border border-black/8 hover:bg-[#2a2a2a]/4 transition-colors"
                  >
                    <span className="text-sm font-bold text-[#2a2a2a]/25 w-5 shrink-0 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-[#2a2a2a]/50">#{item.protocolo}</span>
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
                    <div className="shrink-0 flex items-center gap-3 text-sm text-[#2a2a2a]/40">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {item.contador_apoios}
                      </div>
                      <span>{dias}d</span>
                    </div>
                  </button>
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
          <div className="flex items-center gap-2 text-sm text-[#2a2a2a]/50">
            <span>Abertura:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60"
            />
            <span>até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60"
            />
          </div>
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
                    <th className="text-left px-4 py-3 font-medium">Protocolo</th>
                    <th className="text-left px-4 py-3 font-medium">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Endereço</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Data</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Apoios</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {itens.map((item) => {
                    const cat = catMap[item.id_categoria]
                    const Icone = iconeCategoria(cat?.nome_categoria)
                    const IconeStatus = STATUS_ICONE[item.status]
                    return (
                      <tr key={item.id_solicitacao} className="hover:bg-[#2a2a2a]/2 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#2a2a2a]/60">
                          {item.protocolo}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70">
                            {IconeStatus && <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" />}
                            {STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/60 max-w-[200px] truncate hidden md:table-cell">
                          {item.endereco_referencia}
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/50 whitespace-nowrap hidden lg:table-cell">
                          {formatarData(item.data_registro)}
                        </td>
                        <td className="px-4 py-3 text-[#2a2a2a]/50 hidden lg:table-cell">
                          {item.contador_apoios}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => abrirModal(item)}
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-black/8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[#2a2a2a]/50">#{selecionada.protocolo}</p>
                  <p className="text-sm font-medium text-[#2a2a2a] mt-0.5 line-clamp-2">
                    {selecionada.descricao}
                  </p>
                  <p className="text-xs text-[#2a2a2a]/40 mt-1">{selecionada.endereco_referencia}</p>
                </div>
                <button
                  onClick={fecharModal}
                  className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#2a2a2a]/60 mb-1.5">
                  Novo status
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

            <div className="px-6 pb-5 flex items-center justify-end gap-2">
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
        </div>
      )}
    </div>
  )
}
