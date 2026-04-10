import { useState, useEffect } from 'react'
import { Users, FolderOpen, CheckCircle, Clock, TrendingUp, Star } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import api from '../../services/api'

const PERIODOS = [
  { valor: '7d',   label: '7 dias' },
  { valor: '15d',  label: '15 dias' },
  { valor: '30d',  label: '30 dias' },
  { valor: '90d',  label: '3 meses' },
  { valor: '180d', label: '6 meses' },
  { valor: '365d', label: '1 ano' },
  { valor: 'tudo', label: 'Tudo' },
]

const STATUS_INFO = {
  PENDENTE:     { label: 'Pendente',     cor: '#f59e0b' },
  EM_ANALISE:   { label: 'Em análise',   cor: '#3b82f6' },
  EM_ANDAMENTO: { label: 'Em andamento', cor: '#8b5cf6' },
  RESOLVIDO:    { label: 'Resolvido',    cor: '#3cb478' },
  CANCELADO:    { label: 'Cancelado',    cor: '#9ca3af' },
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// Trata tanto "DD/MM" (granularidade diária) quanto "YYYY-MM" (mensal)
function formatarLabel(label) {
  if (label.includes('/') && label.length === 5) return label // já é "DD/MM"
  const [ano, mes] = label.split('-')
  return `${MESES_PT[parseInt(mes) - 1]}/${ano.slice(2)}`
}

function periodoSub(periodo) {
  if (periodo === 'tudo') return 'todo o período'
  return `últimos ${PERIODOS.find(p => p.valor === periodo)?.label.toLowerCase()}`
}

function tituleTendencia(periodo) {
  const diario = ['7d', '15d', '30d'].includes(periodo)
  const labels = { '7d': '7 dias', '15d': '15 dias', '30d': '30 dias', '90d': '3 meses', '180d': '6 meses', '365d': '1 ano', 'tudo': 'todo o período' }
  return `Tendência ${diario ? 'diária' : 'mensal'} — ${labels[periodo] ?? periodo}`
}

function tickInterval(periodo) {
  if (periodo === '7d') return 0
  if (periodo === '15d') return 1  // every 2nd
  if (periodo === '30d') return 4  // every 5th
  return 0
}

function Estrelas({ valor }) {
  if (valor == null) return <span className="text-sm text-[#2a2a2a]/30">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i <= Math.round(valor)
                ? 'fill-[#f59e0b] text-[#f59e0b]'
                : 'text-[#2a2a2a]/15'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-[#2a2a2a]/60">{valor.toFixed(1)}</span>
    </div>
  )
}

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

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-black/8 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="font-medium text-[#2a2a2a] mb-1.5">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="text-[#2a2a2a]/50">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function TooltipBarra({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-black/8 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold text-[#2a2a2a]">
      {payload[0].value} solicitações
    </div>
  )
}

function Skeleton({ className }) {
  return <div className={`bg-black/5 rounded-2xl animate-pulse ${className}`} />
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('30d')
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    if (dados === null) {
      setCarregando(true)
    } else {
      setAtualizando(true)
    }
    api.get(`/admin/dashboard?periodo=${periodo}`)
      .then((res) => setDados(res.data))
      .catch(() => {})
      .finally(() => { setCarregando(false); setAtualizando(false) })
  }, [periodo])

  const sub = periodoSub(periodo)

  const kpis = dados ? [
    { icone: FolderOpen,  label: 'Em aberto',           valor: dados.total_abertos,                                                    sub: 'pendente + análise + andamento', cor: '#3b82f6' },
    { icone: Users,       label: 'Cidadãos ativos',     valor: dados.total_cidadaos,                                                   sub: 'cadastrados na plataforma',      cor: '#8b5cf6' },
    { icone: TrendingUp,  label: 'Criadas',              valor: dados.total_abertas_periodo,                                            sub,                                   cor: '#f59e0b' },
    { icone: CheckCircle, label: 'Resolvidas',           valor: dados.total_resolvidas_periodo,                                         sub,                                   cor: '#3cb478' },
    { icone: Clock,       label: 'Tempo médio',          valor: dados.tempo_medio_resolucao_dias != null ? `${dados.tempo_medio_resolucao_dias}d` : null, sub: 'para resolução', cor: '#f97316' },
    { icone: Star,        label: 'Índice de resolução',  valor: dados.indice_resolucao_efetiva   != null ? `${dados.indice_resolucao_efetiva}%`   : null, sub: 'confirmadas pelos cidadãos', cor: '#ec4899' },
    { icone: Star,        label: 'Nota média',           valor: dados.media_avaliacao_periodo    != null ? `${dados.media_avaliacao_periodo}/5`    : null, sub,                  cor: '#f59e0b' },
  ] : []

  const dadosTendencia = dados?.grafico_mensal?.map((m) => ({
    mes: formatarLabel(m.mes),
    Criadas: m.criadas,
    Resolvidas: m.resolvidas,
  })) ?? []

  const dadosStatus = dados?.por_status
    ? Object.entries(dados.por_status).map(([k, v]) => ({
        name: STATUS_INFO[k]?.label ?? k,
        valor: v,
        cor: STATUS_INFO[k]?.cor ?? '#ccc',
      }))
    : []

  const dadosCategoria = dados?.por_categoria?.map((c) => ({
    name: c.nome_categoria,
    valor: c.total,
    cor: c.cor_hex,
  })) ?? []

  return (
    <div className="p-6 space-y-5 w-full max-w-[1400px] mx-auto">

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
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-[104px]" />)}
        </div>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-4 transition-opacity duration-300 ${atualizando ? 'opacity-40' : 'opacity-100'}`}>
          {kpis.map((kpi) => <CardKpi key={kpi.label} {...kpi} />)}
        </div>
      )}

      {/* Tendência mensal */}
      {carregando ? (
        <Skeleton className="h-[300px]" />
      ) : (
        <div className={`bg-white rounded-2xl border border-black/8 p-5 transition-opacity duration-300 ${atualizando ? 'opacity-40' : 'opacity-100'}`}>
          <h2 className="text-sm font-semibold text-[#2a2a2a] mb-5">{tituleTendencia(periodo)}</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={dadosTendencia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a0d" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} interval={tickInterval(periodo)} />
              <YAxis tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipCustom />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              <Line type="monotone" dataKey="Criadas"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Resolvidas" stroke="#3cb478" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribuição por status e categoria */}
      {carregando ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[260px]" />
        </div>
      ) : (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 transition-opacity duration-300 ${atualizando ? 'opacity-40' : 'opacity-100'}`}>

          {/* Por status */}
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#2a2a2a] mb-5">Por status</h2>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dadosStatus} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} width={96} />
                <Tooltip content={<TooltipBarra />} cursor={{ fill: '#2a2a2a06' }} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {dadosStatus.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por categoria */}
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#2a2a2a] mb-5">Por categoria</h2>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dadosCategoria} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#2a2a2a80' }} axisLine={false} tickLine={false} width={148} />
                <Tooltip content={<TooltipBarra />} cursor={{ fill: '#2a2a2a06' }} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {dadosCategoria.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* Avaliações */}
      {carregando ? (
        <Skeleton className="h-[120px]" />
      ) : (
        <div className={`bg-white rounded-2xl border border-black/8 p-5 transition-opacity duration-300 ${atualizando ? 'opacity-40' : 'opacity-100'}`}>
          <h2 className="text-sm font-semibold text-[#2a2a2a] mb-5">Avaliações dos cidadãos</h2>
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Média geral */}
            <div className="flex flex-col items-center justify-center gap-2 sm:pr-6 sm:border-r border-black/8 shrink-0">
              <p className="text-xs text-[#2a2a2a]/40">Média geral</p>
              <p className="text-4xl font-bold text-[#2a2a2a] tracking-tight">
                {dados.media_avaliacao_geral?.toFixed(1) ?? <span className="text-[#2a2a2a]/25">—</span>}
              </p>
              <Estrelas valor={dados.media_avaliacao_geral} />
            </div>

            {/* Por categoria */}
            <div className="flex-1 flex flex-col justify-center gap-3">
              {dados.media_avaliacao_por_categoria?.length ? (
                dados.media_avaliacao_por_categoria.map((cat) => (
                  <div key={cat.id_categoria} className="flex items-center gap-4">
                    <span className="text-sm text-[#2a2a2a]/60 w-44 shrink-0">{cat.nome_categoria}</span>
                    <Estrelas valor={cat.media_nota} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#2a2a2a]/30">Nenhuma avaliação registrada ainda.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
