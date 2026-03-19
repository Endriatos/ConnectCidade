import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { X, ThumbsUp, Lightbulb, Trash2, Accessibility, Construction, MapPin, Calendar } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import api from '../services/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconeCategoria = (nome) => {
  if (nome?.includes('Iluminação')) return Lightbulb
  if (nome?.includes('Coleta'))     return Trash2
  if (nome?.includes('Acessib'))    return Accessibility
  if (nome?.includes('Manutenção')) return Construction
  return MapPin
}

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  EM_ANDAMENTO: 'Em Andamento',
  RESOLVIDO: 'Resolvido',
}

const STATUS_COR = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  EM_ANALISE: 'bg-blue-100 text-blue-700',
  EM_ANDAMENTO: 'bg-orange-100 text-orange-700',
  RESOLVIDO: 'bg-green-100 text-green-700',
}

const formatarData = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

const criarIcone = (cor) => L.divIcon({
  className: '',
  html: `<div style="background:${cor};width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function RecentrarMapa({ lat, lng }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.setView([lat, lng], 14)
  }, [lat, lng, mapa])
  return null
}

export default function Mapa() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [categorias, setCategorias] = useState({})
  const [posicao, setPosicao] = useState(null)
  const [selecionada, setSelecionada] = useState(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosicao([pos.coords.latitude, pos.coords.longitude]),
      () => setPosicao([-29.1678, -51.1794])
    )
  }, [])

  useEffect(() => {
    api.get('/categorias').then((res) => {
      const mapa = {}
      res.data.forEach((c) => { mapa[c.id_categoria] = c })
      setCategorias(mapa)
    }).catch(() => {})

    api.get('/mapa/solicitacoes').then((res) => {
      setSolicitacoes(res.data)
    }).catch(() => {})
  }, [])

  const posicaoInicial = posicao ?? [-29.1678, -51.1794]

  const cat = selecionada ? categorias[selecionada.id_categoria] : null
  const Icone = cat ? iconeCategoria(cat.nome_categoria) : MapPin

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={posicaoInicial}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {posicao && <RecentrarMapa lat={posicao[0]} lng={posicao[1]} />}
        {posicao && (
          <CircleMarker
            center={posicao}
            radius={10}
            pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 3 }}
          />
        )}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
          {solicitacoes.map((sol) => {
            const c = categorias[sol.id_categoria]
            const cor = c?.cor_hex ?? '#3cb478'
            return (
              <Marker
                key={sol.id_solicitacao}
                position={[sol.latitude, sol.longitude]}
                icon={criarIcone(cor)}
                eventHandlers={{ click: () => setSelecionada(sol) }}
              />
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Bottom sheet */}
      {selecionada && cat && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl">

          {/* Cabeçalho */}
          <div className="px-6 pt-5 pb-4 border-b border-black/5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2"
                    style={{ borderColor: cat.cor_hex, color: cat.cor_hex, backgroundColor: `${cat.cor_hex}15` }}
                  >
                    <Icone className="h-3.5 w-3.5" />
                    {cat.nome_categoria}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COR[selecionada.status]}`}>
                    {STATUS_LABEL[selecionada.status]}
                  </span>
                </div>
                <span className="text-sm text-[#2a2a2a]/50 font-mono">#{selecionada.protocolo}</span>
              </div>
              <button
                onClick={() => setSelecionada(null)}
                className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Detalhes */}
          <div className="px-6 py-4 space-y-2.5">
            <div className="flex items-start gap-2 text-sm text-[#2a2a2a]/70">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{selecionada.endereco_referencia}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[#2a2a2a]/70">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatarData(selecionada.data_registro)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>{selecionada.contador_apoios} apoios</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
