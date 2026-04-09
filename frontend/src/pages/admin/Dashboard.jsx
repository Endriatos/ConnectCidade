import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FolderOpen, CheckCircle, Clock, TrendingUp, Star, ThumbsUp, Flame } from 'lucide-react'
import api from '../../services/api'
import MapaMini from '../../components/admin/MapaMini'
import { STATUS_LABEL, STATUS_ESTILO, formatarData } from '../../utils/solicitacaoStatus'
import { iconeCategoria } from '../../utils/categoriaIcone'

const PERIODOS = [
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: '90d', label: '90 dias' },
  { valor: 'tudo', label: 'Tudo' },
]

function CardKpi({ icone: Icone, label, valor, sub, cor }) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#2a2a2a]/50">{label}</span>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cor}18` }}>
          <Icone className="h-4 w-4" style={{ color: cor }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#2a2a2a] tracking-tight">
          {valor ?? <span className="text-[#2a2a2a]/30">—</span>}
        </p>
        {sub && <p className="text-xs text-[#2a2a2a]/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function diasDesde(iso) {
  if (!iso) return 0
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86400000)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState('30d')
  const [dados, setDados] = useState(null)
  const [fila, setFila] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    api.get(`/admin/dashboard?periodo=${periodo}`)
      .then((res) => setDados(res.data))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [periodo])

  useEffect(() => {
    api.get('/admin/dashboard/fila-atencao')
      .then((res) => setFila(res.data))
      .catch(() => {})
  }, [])

  const kpis = dados
    ? [
        {
          icone: FolderOpen,
          label: 'Em aberto',
          valor: dados.total_abertos,
          sub: 'pendente + análise + andamento',
          cor: '#3b82f6',
        },
        {
          icone: Users,
          label: 'Cidadãos ativos',
          valor: dados.total_cidadaos,
          sub: 'cadastrados na plataforma',
          cor: '#8b5cf6',
        },
        {
          icone: TrendingUp,
          label: 'Criadas no período',
          valor: dados.total_abertas_periodo,
          sub: `últimos ${PERIODOS.find(p => p.valor === periodo)?.label.toLowerCase()}`,
          cor: '#f59e0b',
        },
        {
          icone: CheckCircle,
          label: 'Resolvidas no período',
          valor: dados.total_resolvidas_periodo,
          sub: `últimos ${PERIODOS.find(p => p.valor === periodo)?.label.toLowerCase()}`,
          cor: '#3cb478',
        },
        {
          icone: Clock,
          label: 'Tempo médio',
          valor: dados.tempo_medio_resolucao_dias != null ? `${dados.tempo_medio_resolucao_dias} dias` : null,
          sub: 'para resolução no período',
          cor: '#f97316',
        },
        {
          icone: Star,
          label: 'Índice de resolução',
          valor: dados.indice_resolucao_efetiva != null ? `${dados.indice_resolucao_efetiva}%` : null,
          sub: 'confirmadas pelos cidadãos',
          cor: '#ec4899',
        },
      ]
    : []

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-1 bg-white border border-black/8 rounded-xl p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodo === p.valor
                  ? 'bg-[#3cb478] text-white'
                  : 'text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {carregando ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/8 p-5 h-[104px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <CardKpi key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      {/* Mapa + Fila de atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Mapa — ocupa 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/8 p-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[#2a2a2a]">Mapa de solicitações</h2>
          <div className="flex-1 min-h-[280px]">
            <MapaMini />
          </div>
        </div>

        {/* Fila de atenção — ocupa 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/8 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#f97316]" />
            <h2 className="text-sm font-medium text-[#2a2a2a]">Mais quentes</h2>
            <span className="text-xs text-[#2a2a2a]/40 ml-auto">score = apoios + dias/3</span>
          </div>

          {fila.length === 0 ? (
            <p className="text-sm text-[#2a2a2a]/40 py-4 text-center">Nenhuma solicitação em aberto.</p>
          ) : (
            <div className="space-y-2">
              {fila.map((item, idx) => {
                const Icone = iconeCategoria(item.nome_categoria)
                const estilo = STATUS_ESTILO[item.status] ?? {}
                const dias = diasDesde(item.data_registro)
                return (
                  <button
                    key={item.id_solicitacao}
                    onClick={() => navigate(`/admin/solicitacoes?protocolo=${item.protocolo}`)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-[#2a2a2a]/4 transition-colors group"
                  >
                    <span className="text-xs font-bold text-[#2a2a2a]/25 w-4 shrink-0 pt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[#2a2a2a]/60">#{item.protocolo}</span>
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: `${item.cor_hex}18`, color: item.cor_hex, borderColor: `${item.cor_hex}35` }}
                        >
                          <Icone className="h-3 w-3" />
                          {item.nome_categoria}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: estilo.bg, color: estilo.text, borderColor: estilo.border }}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      <p className="text-xs text-[#2a2a2a]/50 truncate">{item.endereco_referencia}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-[#2a2a2a]/40">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {item.contador_apoios}
                      </div>
                      <span>{dias}d</span>
                      <span className="font-semibold text-[#f97316]">#{item.score}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
