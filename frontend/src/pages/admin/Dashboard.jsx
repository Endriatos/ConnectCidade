import { useState, useEffect } from 'react'
import { Users, FolderOpen, CheckCircle, Clock, TrendingUp, Star } from 'lucide-react'
import api from '../../services/api'

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

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('30d')
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    api.get(`/admin/dashboard?periodo=${periodo}`)
      .then((res) => setDados(res.data))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [periodo])

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

    </div>
  )
}
