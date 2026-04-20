import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  MapPin,
  Calendar,
  ChevronDown,
  User,
  ExternalLink,
} from 'lucide-react'
import Lottie from 'lottie-react'
import typing from '../../assets/Typing.json'
import api from '../../services/api'
import Timeline from '../minhasSolicitacoes/timeline/Timeline'
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
import InlineNotice from '../common/InlineNotice'

const STATUS_OPCOES = [
  { valor: '', label: 'Todos os status' },
  { valor: 'PENDENTE', label: 'Pendente' },
  { valor: 'EM_ANALISE', label: 'Em análise' },
  { valor: 'EM_ANDAMENTO', label: 'Em andamento' },
  { valor: 'RESOLVIDO', label: 'Resolvido' },
  { valor: 'CANCELADO', label: 'Cancelado' },
]

const inputCls =
  'h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30 w-full'

export default function ModalGerenciarSolicitacao({
  preview,
  categorias,
  meuIdUsuario,
  onClose,
  onSucessoStatus,
  onFeedbackErro,
}) {
  const modalCargaRef = useRef(0)
  const [carregandoModal, setCarregandoModal] = useState(false)
  const [erroDetalheModal, setErroDetalheModal] = useState(null)
  const [detalhe, setDetalhe] = useState(preview)
  const [fotosModal, setFotosModal] = useState([])
  const [carregandoFotos, setCarregandoFotos] = useState(false)
  const [fotoAtiva, setFotoAtiva] = useState(null)
  const [statusNovo, setStatusNovo] = useState(preview.status)
  const [comentario, setComentario] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const [erroModal, setErroModal] = useState('')
  const [timeline, setTimeline] = useState([])
  const [carregandoTimeline, setCarregandoTimeline] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [modalEmBreve, setModalEmBreve] = useState(false)

  const navigate = useNavigate()
  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id_categoria, c])), [categorias])

  useEffect(() => {
    const id = preview.id_solicitacao
    modalCargaRef.current += 1
    const seq = modalCargaRef.current
    setCarregandoTimeline(true)
    setCarregandoModal(true)
    setDetalhe(preview)
    setStatusNovo(preview.status)
    setErroDetalheModal(null)
    setComentario('')
    setErroModal('')
    setFotosModal([])
    setCarregandoFotos(true)
    setTimeline([])
    setHistoricoAberto(false)
    setFotoAtiva(null)
    Promise.allSettled([
      api
        .get(`/admin/solicitacoes/${id}`)
        .then((res) => {
          if (modalCargaRef.current !== seq) return
          setDetalhe(res.data)
          setStatusNovo(res.data.status)
        })
        .catch(() => {
          if (modalCargaRef.current !== seq) return
          setErroDetalheModal('Não foi possível carregar o detalhe da solicitação.')
        }),
      api
        .get(`/solicitacoes/${id}/fotos`)
        .then((res) => {
          if (modalCargaRef.current !== seq) return
          setFotosModal(res.data)
        })
        .catch(() => {})
        .finally(() => {
          if (modalCargaRef.current !== seq) return
          setCarregandoFotos(false)
        }),
      api
        .get(`/solicitacoes/${id}/timeline`)
        .then((res) => {
          if (modalCargaRef.current !== seq) return
          setTimeline(res.data)
        })
        .catch(() => {})
        .finally(() => {
          if (modalCargaRef.current !== seq) return
          setCarregandoTimeline(false)
        }),
    ]).finally(() => {
      if (modalCargaRef.current !== seq) return
      setCarregandoModal(false)
    })
  }, [preview])

  const fecharModal = () => {
    modalCargaRef.current += 1
    setCarregandoModal(false)
    setFotoAtiva(null)
    onClose()
  }

  const irParaFichaSolicitante = () => {
    if (detalhe == null) return
    if (typeof detalhe.id_autor === 'number' && detalhe.id_autor > 0) {
      const id = detalhe.id_autor
      fecharModal()
      navigate(`/admin/usuarios/${id}`)
      return
    }
    setModalEmBreve(true)
  }

  const propriaAutoriaAdmin =
    detalhe != null &&
    meuIdUsuario !== null &&
    typeof detalhe.id_autor === 'number' &&
    detalhe.id_autor === meuIdUsuario
  const podeAlterarStatusNoModal = detalhe != null && !erroDetalheModal && !propriaAutoriaAdmin

  const handleAtualizarStatus = () => {
    if (!podeAlterarStatusNoModal) return
    if (!comentario.trim()) {
      setErroModal('O comentário é obrigatório.')
      return
    }
    setAtualizando(true)
    setErroModal('')
    api
      .patch(`/admin/solicitacoes/${detalhe.id_solicitacao}/status`, {
        status_novo: statusNovo,
        comentario: comentario.trim(),
      })
      .then((res) => {
        setCarregandoTimeline(true)
        api
          .get(`/solicitacoes/${res.data.id_solicitacao}/timeline`)
          .then((r) => setTimeline(r.data))
          .catch(() => {})
          .finally(() => setCarregandoTimeline(false))
        onSucessoStatus?.(res.data)
        fecharModal()
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? 'Erro ao atualizar status.'
        setErroModal(msg)
        onFeedbackErro?.(msg)
      })
      .finally(() => setAtualizando(false))
  }

  const eventosTimeline = useMemo(() => {
    if (!detalhe) return []
    const eventosOrdenados = construirEventosTimeline(detalhe, timeline)
    const statusAtualNaSolicitacao = detalhe.status
    const statusMaisRecenteNoHistorico = obterUltimoStatusNosEventos(eventosOrdenados)
    const eventosComDestaqueDeStatus =
      statusMaisRecenteNoHistorico === statusAtualNaSolicitacao
        ? marcarComoAtualUltimoEventoComEsseStatus(eventosOrdenados, statusAtualNaSolicitacao)
        : eventosOrdenados
    return marcarUltimaAvaliacaoComoEtapaAtual(eventosComDestaqueDeStatus)
  }, [detalhe, timeline])

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={fecharModal}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={fecharModal}
            className="absolute top-5 right-6 z-40 text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
          {carregandoModal && (
            <div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-[2px]"
              aria-busy="true"
              aria-live="polite"
            >
              <div className="w-9 h-9 border-2 border-[#3cb478] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#2a2a2a]/55">Carregando...</p>
            </div>
          )}
          <div className="px-6 pt-5 pb-4 pr-14 border-b border-black/8 shrink-0">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {erroDetalheModal && (
                  <p className="text-sm text-red-600 mb-3">{erroDetalheModal}</p>
                )}
                {detalhe && (
                  <>
                    <p className="font-mono text-xs text-[#2a2a2a]/40 mb-1">#{detalhe.protocolo}</p>
                    <p className="text-base font-semibold text-[#2a2a2a] leading-snug">{detalhe.descricao}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {(() => {
                        const cat =
                          catMap[detalhe.id_categoria] ??
                          (detalhe.nome_categoria
                            ? { nome_categoria: detalhe.nome_categoria, cor_hex: detalhe.cor_hex }
                            : null)
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
                        const IconeStatus = STATUS_ICONE[detalhe.status]
                        return (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1.5 text-sm font-medium text-[#2a2a2a]/70">
                            {IconeStatus && <IconeStatus className="h-4 w-4 text-[#2a2a2a]/55" />}
                            {STATUS_LABEL[detalhe.status]}
                          </span>
                        )
                      })()}
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#2a2a2a]/45">
                        <Calendar className="h-3.5 w-3.5" />
                        {detalhe.data_registro ? formatarData(detalhe.data_registro) : '—'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#2a2a2a]/45">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {detalhe.contador_apoios ?? 0} apoio{(detalhe.contador_apoios ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {detalhe && (
              <>
                <div className="px-6 py-3 border-b border-black/8">
                  <button
                    type="button"
                    onClick={() => irParaFichaSolicitante()}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 hover:bg-[#2a2a2a]/4 transition-colors"
                  >
                    <User className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" />
                    <span className="text-sm font-medium text-[#2a2a2a]/80">{detalhe.nome_autor ?? '—'}</span>
                  </button>
                </div>
                <div className="px-6 py-4 space-y-2.5 border-b border-black/8">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-start gap-2 text-sm text-[#2a2a2a]/70">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{detalhe.endereco_referencia ?? '—'}</span>
                    </div>
                    {typeof detalhe.latitude === 'number' && typeof detalhe.longitude === 'number' && (
                      <a
                        href={`https://www.google.com/maps?q=${detalhe.latitude},${detalhe.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        Mapa
                      </a>
                    )}
                  </div>
                  {typeof detalhe.latitude === 'number' && typeof detalhe.longitude === 'number' ? (
                    <div className="font-mono text-xs text-[#2a2a2a]/40 pl-6">
                      {detalhe.latitude.toFixed(6)}, {detalhe.longitude.toFixed(6)}
                    </div>
                  ) : null}
                </div>

                {!erroDetalheModal && (
                  <div
                    className={`px-6 py-5 space-y-4 border-b border-black/8 ${propriaAutoriaAdmin ? 'opacity-80' : ''}`}
                  >
                    <p className="text-sm font-semibold text-[#2a2a2a]">Atualizar status</p>
                    {propriaAutoriaAdmin && (
                      <InlineNotice>
                        Você é o autor desta solicitação. Por política de gestão, outro administrador deve atualizar o
                        status.
                      </InlineNotice>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-[#2a2a2a]/60 mb-1.5">
                        Selecione o novo status
                      </label>
                      <select
                        value={statusNovo}
                        onChange={(e) => setStatusNovo(e.target.value)}
                        disabled={!podeAlterarStatusNoModal}
                        className={`${inputCls} disabled:bg-[#f5f5f5] disabled:text-[#2a2a2a]/50 disabled:cursor-not-allowed`}
                      >
                        {STATUS_OPCOES.filter((s) => s.valor).map((s) => (
                          <option key={s.valor} value={s.valor}>
                            {s.label}
                          </option>
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
                        disabled={!podeAlterarStatusNoModal}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30 disabled:bg-[#f5f5f5] disabled:text-[#2a2a2a]/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {erroModal && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        {erroModal}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

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

            <div className="border-t border-black/8">
              <button
                type="button"
                onClick={() => setHistoricoAberto((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#2a2a2a] hover:bg-[#2a2a2a]/3 transition-colors"
              >
                Histórico
                <ChevronDown
                  className={`h-4 w-4 text-[#2a2a2a]/40 transition-transform duration-200 ${historicoAberto ? 'rotate-180' : ''}`}
                />
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

          <div className="px-6 py-4 border-t border-black/8 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={fecharModal}
              className="h-9 px-4 rounded-xl text-sm text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAtualizarStatus}
              disabled={atualizando || !podeAlterarStatusNoModal}
              className="h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              {atualizando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

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

      {modalEmBreve && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalEmBreve(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-sm text-center mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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
    </>
  )
}
