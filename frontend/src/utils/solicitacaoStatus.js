import { Check, Clock3, Search, Wrench, X } from 'lucide-react'

export const COR_MARCADOR_HISTORICO = '#3cb478'

export const STATUS_ICONE = {
  PENDENTE: Clock3,
  EM_ANALISE: Search,
  EM_ANDAMENTO: Wrench,
  RESOLVIDO: Check,
  CANCELADO: X,
}

export const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  CANCELADO: 'Cancelado',
}

export const opcoesFiltro = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'PENDENTE', label: STATUS_LABEL.PENDENTE },
  { id: 'EM_ANALISE', label: STATUS_LABEL.EM_ANALISE },
  { id: 'EM_ANDAMENTO', label: STATUS_LABEL.EM_ANDAMENTO },
  { id: 'RESOLVIDO', label: STATUS_LABEL.RESOLVIDO },
  { id: 'CANCELADO', label: STATUS_LABEL.CANCELADO },
]

export const STATUS_COR = {
  PENDENTE: 'hsl(221, 83%, 53%)',
  EM_ANALISE: 'hsl(45, 93%, 47%)',
  EM_ANDAMENTO: 'hsl(25, 95%, 53%)',
  RESOLVIDO: 'hsl(142, 71%, 45%)',
  CANCELADO: 'hsl(0, 72%, 50%)',
}

export const STATUS_ESTILO = {
  PENDENTE: { bg: 'rgba(37,99,235,0.14)', text: '#1d4ed8', border: 'rgba(37,99,235,0.24)' },
  EM_ANALISE: { bg: 'rgba(202,138,4,0.14)', text: '#a16207', border: 'rgba(202,138,4,0.24)' },
  EM_ANDAMENTO: { bg: 'rgba(234,88,12,0.14)', text: '#c2410c', border: 'rgba(234,88,12,0.24)' },
  RESOLVIDO: { bg: 'rgba(22,163,74,0.14)', text: '#15803d', border: 'rgba(22,163,74,0.24)' },
  CANCELADO: { bg: 'rgba(220,38,38,0.14)', text: '#b91c1c', border: 'rgba(220,38,38,0.24)' },
}

export const formatarData = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export const formatarDataHora = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ORDEM_STATUS = ['PENDENTE', 'EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDO']

const DESCRICAO_FLUXO = {
  PENDENTE: 'Solicitação recebida e aguardando triagem inicial.',
  EM_ANALISE: 'Equipe técnica avaliando prioridade e viabilidade do atendimento.',
  EM_ANDAMENTO: 'Serviço encaminhado para execução em campo.',
  RESOLVIDO: 'Atendimento finalizado e solicitação encerrada.',
  CANCELADO: 'Solicitação encerrada sem execução por cancelamento.',
}

export const RESUMO_STATUS = {
  PENDENTE: 'Aguardando análise inicial da equipe responsável.',
  EM_ANALISE: 'Em avaliação técnica para definição de prioridade e execução.',
  EM_ANDAMENTO: 'Atendimento em execução pela equipe de campo.',
  RESOLVIDO: 'Solicitação finalizada com atendimento concluído.',
  CANCELADO: 'Solicitação encerrada por cancelamento.',
}

export const PROXIMO_PASSO_STATUS = {
  PENDENTE: 'Após a triagem, a solicitação passa para Em análise.',
  EM_ANALISE: 'Com validação técnica, o atendimento avança para Em andamento.',
  EM_ANDAMENTO: 'Ao concluir o serviço no local, o status muda para Resolvido.',
  RESOLVIDO: 'Não há próximos passos pendentes para esta solicitação.',
  CANCELADO: 'Não há próximos passos porque a solicitação foi encerrada.',
}

function construirFluxoProvavel(statusAtual) {
  if (statusAtual === 'CANCELADO') {
    return [
      {
        key: 'fluxo-pendente',
        status: 'PENDENTE',
        titulo: STATUS_LABEL.PENDENTE,
        descricao: DESCRICAO_FLUXO.PENDENTE,
        estado: 'concluido',
      },
      {
        key: 'fluxo-cancelado',
        status: 'CANCELADO',
        titulo: STATUS_LABEL.CANCELADO,
        descricao: DESCRICAO_FLUXO.CANCELADO,
        estado: 'atual',
      },
    ]
  }

  const idxAtual = Math.max(0, ORDEM_STATUS.indexOf(statusAtual))
  return ORDEM_STATUS.map((status, idx) => ({
    key: `fluxo-${status}`,
    status,
    titulo: STATUS_LABEL[status],
    descricao: DESCRICAO_FLUXO[status],
    estado: idx < idxAtual ? 'concluido' : idx === idxAtual ? 'atual' : 'previsto',
  }))
}

export function construirEventosPrevistos(statusAtual) {
  return construirFluxoProvavel(statusAtual).map((passo) => ({
    key: `prev-${passo.key}`,
    tipo: 'previsto',
    data: null,
    dataLabel: 'Previsto',
    titulo: passo.titulo,
    descricao: passo.descricao,
    autor: null,
    cor: COR_MARCADOR_HISTORICO,
    estado: passo.estado,
    status: passo.status,
  }))
}

const ORDEM_TIPO_NA_MESMA_DATA = { criacao: 0, estado_inicial_pendente: 1, atualizacao: 2 }

function compararEventosTimeline(a, b) {
  const ta = a.data ? new Date(a.data).getTime() : 0
  const tb = b.data ? new Date(b.data).getTime() : 0
  if (ta !== tb) return ta - tb
  return (ORDEM_TIPO_NA_MESMA_DATA[a.tipo] ?? 9) - (ORDEM_TIPO_NA_MESMA_DATA[b.tipo] ?? 9)
}

export function ultimoCodigoStatusNaTimeline(eventos) {
  for (let i = eventos.length - 1; i >= 0; i--) {
    const s = eventos[i].status
    if (s != null) return s
  }
  return null
}

export function montarEventosTimeline(solicitacao, atualizacoes) {
  const eventos = [
    {
      key: `criacao-${solicitacao.id_solicitacao}`,
      tipo: 'criacao',
      data: solicitacao.data_registro,
      titulo: 'Solicitação registrada',
      descricao: 'Sua solicitação foi recebida pela plataforma.',
      autor: null,
      cor: COR_MARCADOR_HISTORICO,
    },
    {
      key: `pendente-inicial-${solicitacao.id_solicitacao}`,
      tipo: 'estado_inicial_pendente',
      data: solicitacao.data_registro,
      titulo: STATUS_LABEL.PENDENTE,
      descricao: RESUMO_STATUS.PENDENTE,
      autor: null,
      cor: COR_MARCADOR_HISTORICO,
      status: 'PENDENTE',
    },
  ]
  for (const a of atualizacoes) {
    const novo = STATUS_LABEL[a.status_novo] ?? a.status_novo
    eventos.push({
      key: `at-${a.id_atualizacao}`,
      tipo: 'atualizacao',
      data: a.data_atualizacao,
      titulo: novo,
      descricao: a.comentario || 'Sem comentário adicional.',
      autor: a.nome_administrador,
      cor: COR_MARCADOR_HISTORICO,
      status: a.status_novo,
    })
  }
  return eventos.sort(compararEventosTimeline)
}

export function destacarUltimoEventoComStatusIgual(eventos, codigoStatus) {
  let idx = -1
  for (let i = eventos.length - 1; i >= 0; i--) {
    if (eventos[i].status === codigoStatus) {
      idx = i
      break
    }
  }
  if (idx < 0) return eventos
  return eventos.map((ev, i) => (i === idx ? { ...ev, estado: 'atual' } : ev))
}
