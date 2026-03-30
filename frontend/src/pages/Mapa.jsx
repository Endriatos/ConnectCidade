import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { X, ThumbsUp, Lightbulb, Trash2, Accessibility, Construction, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import api from '../services/api'
import Lottie from 'lottie-react'
import typing from '../assets/Typing.json'

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
  PENDENTE:     'hsl(221, 83%, 53%)',
  EM_ANALISE:   'hsl(45, 93%, 47%)',
  EM_ANDAMENTO: 'hsl(25, 95%, 53%)',
  RESOLVIDO:    'hsl(142, 71%, 45%)',
  CANCELADO:    'hsl(0, 72%, 50%)',
}

const formatarData = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

const PIN_HTML = (cor, animado) => `
  <div style="animation:${animado ? 'pin-bounce 0.6s ease infinite alternate' : 'none'};">
    <div style="
      background-color:${cor};
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
    </div>
  </div>
`

const iconeLocalizacao = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;
        width:24px;height:24px;
        border-radius:50%;
        background:#3b82f6;
        opacity:0.6;
        animation:location-pulse 1.8s ease-out infinite;
      "></div>
      <div style="
        width:14px;height:14px;
        border-radius:50%;
        background:#3b82f6;
        border:2.5px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        position:relative;z-index:1;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const criarIcone = (cor, animado = false) => L.divIcon({
  className: 'custom-marker',
  html: PIN_HTML(cor, animado),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

function FecharAoClicar({ onClique }) {
  useMapEvents({ click: onClique })
  return null
}

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
  const [fotos, setFotos] = useState([])
  const [carregandoFotos, setCarregandoFotos] = useState(false)
  const [fotoAtiva, setFotoAtiva] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [modalEmBreve, setModalEmBreve] = useState(false)
  const [animApoio, setAnimApoio] = useState(null)

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

  useEffect(() => {
    if (!selecionada?.id_solicitacao) return
    api.get(`/solicitacoes/${selecionada.id_solicitacao}`).then((res) => {
      setSelecionada((prev) =>
        prev?.id_solicitacao === selecionada.id_solicitacao ? { ...prev, ...res.data } : prev
      )
    }).catch(() => {})
  }, [selecionada?.id_solicitacao])

  useEffect(() => {
    if (!selecionada?.id_solicitacao) { setFotos([]); return }
    setCarregandoFotos(true)
    api.get(`/solicitacoes/${selecionada.id_solicitacao}/fotos`)
      .then((res) => setFotos(res.data))
      .catch(() => setFotos([]))
      .finally(() => setCarregandoFotos(false))
  }, [selecionada?.id_solicitacao])

  useEffect(() => {
    setAnimApoio(null)
  }, [selecionada?.id_solicitacao])

  const apoiarSolicitacao = (idSolicitacao) => {
    api.post(`/apoios/${idSolicitacao}`).then(() => {
      setSolicitacoes((prev) => prev.map((sol) =>
        sol.id_solicitacao === idSolicitacao
          ? { ...sol, contador_apoios: sol.contador_apoios + 1, ja_apoiado: true }
          : sol
      ))
      setSelecionada((prev) =>
        prev?.id_solicitacao === idSolicitacao
          ? { ...prev, contador_apoios: prev.contador_apoios + 1, ja_apoiado: true }
          : prev
      )
    }).catch(() => {})
  }

  const desapoiarSolicitacao = (idSolicitacao) => {
    api.delete(`/apoios/${idSolicitacao}`).then(() => {
      setSolicitacoes((prev) => prev.map((sol) =>
        sol.id_solicitacao === idSolicitacao
          ? { ...sol, contador_apoios: Math.max(0, sol.contador_apoios - 1), ja_apoiado: false }
          : sol
      ))
      setSelecionada((prev) =>
        prev?.id_solicitacao === idSolicitacao
          ? { ...prev, contador_apoios: Math.max(0, prev.contador_apoios - 1), ja_apoiado: false }
          : prev
      )
    }).catch(() => {})
  }

  const handleToggleApoio = () => {
    if (!selecionada) return
    if (selecionada.ja_apoiado) {
      setAnimApoio('menos')
      desapoiarSolicitacao(selecionada.id_solicitacao)
    } else {
      setAnimApoio('mais')
      apoiarSolicitacao(selecionada.id_solicitacao)
    }
  }

  const handleAnimacaoApoioFim = (e) => {
    if (e.target !== e.currentTarget) return
    if (e.animationName !== 'thumb-apoio-pop' && e.animationName !== 'thumb-apoio-menos') return
    setAnimApoio(null)
  }

  const posicaoInicial = posicao ?? [-29.1678, -51.1794]
  const solicitacoesFiltradas = categoriaFiltro
    ? solicitacoes.filter((s) => s.id_categoria === categoriaFiltro)
    : solicitacoes

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
        <ZoomControl position="topleft" />
        <FecharAoClicar onClique={() => setSelecionada(null)} />
        {posicao && <RecentrarMapa lat={posicao[0]} lng={posicao[1]} />}
        {posicao && (
          <Marker position={posicao} icon={iconeLocalizacao} interactive={false} />
        )}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={20}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount()
            const size = count < 10 ? 36 : count < 100 ? 42 : 48
            return L.divIcon({
              html: `
                <div style="
                  width:${size}px;height:${size}px;
                  border-radius:50%;
                  background:#3cb478;
                  border:3px solid white;
                  box-shadow:0 2px 8px rgba(0,0,0,0.3);
                  display:flex;align-items:center;justify-content:center;
                  color:white;font-weight:700;font-size:${count < 10 ? 14 : 12}px;
                  font-family:inherit;
                ">${count}</div>
              `,
              className: '',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            })
          }}
        >
          {solicitacoesFiltradas.map((sol) => {
            const c = categorias[sol.id_categoria]
            const cor = c?.cor_hex ?? '#3cb478'
            return (
              <Marker
                key={sol.id_solicitacao}
                position={[sol.latitude, sol.longitude]}
                icon={criarIcone(cor, selecionada?.id_solicitacao === sol.id_solicitacao)}
                eventHandlers={{ click: () => setSelecionada(sol) }}
              />
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Filtro de categorias */}
      {Object.keys(categorias).length > 0 && (() => {
        const catsArr = Object.values(categorias)
        const opcoes = [
          { id: null, Icone: null, cor: null },
          ...catsArr.map((cat) => ({ id: cat.id_categoria, Icone: iconeCategoria(cat.nome_categoria), cor: cat.cor_hex })),
        ]
        const idxAtivo = opcoes.findIndex((o) => o.id === categoriaFiltro)
        const tamanho = 36
        const gap = 6

        return (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm shadow-md rounded-full px-1.5 py-1.5">
            <div className="relative flex items-center" style={{ gap }}>
              {/* Pill deslizante */}
              <div
                className="absolute rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: tamanho,
                  height: tamanho,
                  transform: `translateX(${idxAtivo * (tamanho + gap)}px)`,
                  backgroundColor: opcoes[idxAtivo]?.cor ? `${opcoes[idxAtivo].cor}25` : '#3cb47825',
                  border: `2px solid ${opcoes[idxAtivo]?.cor ?? '#3cb478'}`,
                }}
              />
              {opcoes.map((opcao) => {
                const ativo = categoriaFiltro === opcao.id
                return (
                  <button
                    key={opcao.id ?? 'todos'}
                    onClick={() => setCategoriaFiltro(opcao.id)}
                    className="relative z-10 flex items-center justify-center transition-colors duration-300"
                    style={{ width: tamanho, height: tamanho }}
                  >
                    {opcao.Icone ? (
                      <opcao.Icone
                        className="h-4 w-4 transition-colors duration-300"
                        style={{ color: ativo ? opcao.cor : '#2a2a2a40' }}
                      />
                    ) : (
                      /* Ícone "Todos": 4 quadrantes com as cores das categorias */
                      <div className="grid grid-cols-2 gap-px w-4 h-4 rounded-sm overflow-hidden">
                        {catsArr.slice(0, 4).map((cat) => (
                          <div
                            key={cat.id_categoria}
                            className="transition-opacity duration-300"
                            style={{
                              backgroundColor: cat.cor_hex,
                              opacity: ativo ? 1 : 0.25,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Bottom sheet */}
      {selecionada && cat && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">

          {/* Cabeçalho */}
          <div className="px-6 pt-5 pb-4 border-b border-black/5 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium border-2"
                    style={{ borderColor: cat.cor_hex, color: cat.cor_hex, backgroundColor: `${cat.cor_hex}15` }}
                  >
                    <Icone className="h-4 w-4" />
                    {cat.nome_categoria}
                  </span>
                  <span
                    className="text-[14px] font-medium px-3 py-1.5 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COR[selecionada.status] }}
                  >
                    {STATUS_LABEL[selecionada.status]}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-sm text-[#2a2a2a]/50">
                  <span className="font-mono shrink-0">#{selecionada.protocolo}</span>
                  <span className="text-[#2a2a2a]/40 shrink-0">·</span>
                  <span className="break-words">{selecionada.descricao}</span>
                </div>
              </div>
              <button
                onClick={() => setSelecionada(null)}
                className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0 ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="overflow-y-auto">

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
              <button
                type="button"
                className="flex items-center gap-2 hover:text-[#3cb478] transition-colors active:scale-[0.98]"
                onClick={handleToggleApoio}
              >
                <span
                  className={`inline-flex shrink-0 origin-center will-change-transform ${selecionada?.ja_apoiado ? 'text-[#3cb478]' : ''} ${animApoio === 'mais' ? 'animate-thumb-apoio-mais' : animApoio === 'menos' ? 'animate-thumb-apoio-menos' : ''}`}
                  onAnimationEnd={handleAnimacaoApoioFim}
                >
                  <ThumbsUp
                    className="h-4 w-4"
                    fill={selecionada?.ja_apoiado ? 'currentColor' : 'none'}
                  />
                </span>
                <span>
                  {selecionada.contador_apoios} apoio
                  {selecionada.contador_apoios > 1 ? 's' : ''}
                </span>
              </button>
            </div>
          </div>

          {/* Galeria de fotos */}
          {(carregandoFotos || fotos.length > 0) && (
            <div className="pb-5">
              {carregandoFotos ? (
                <div className="flex gap-3 px-6 overflow-x-auto">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="shrink-0 w-24 h-24 rounded-xl bg-black/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 px-6 overflow-x-auto">
                  {fotos.map((foto, idx) => (
                    <img
                      key={foto.id_foto}
                      src={foto.caminho_arquivo}
                      alt={`Foto ${foto.ordem}`}
                      className="shrink-0 w-24 h-24 rounded-xl object-cover cursor-pointer"
                      onClick={() => setFotoAtiva(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          </div>{/* fim scroll */}
        </div>
      )}
      {/* Lightbox */}
      {fotoAtiva !== null && (
        <div
          className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50"
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
                src={fotos[fotoAtiva].caminho_arquivo}
                alt={`Foto ${fotoAtiva + 1}`}
                className="max-h-[60vh] max-w-[85vw] object-contain"
              />

              {fotoAtiva < fotos.length - 1 && (
                <button
                  className="absolute right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  onClick={() => setFotoAtiva(fotoAtiva + 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {fotos.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3">
                {fotos.map((_, idx) => (
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
      {/* Modal em breve */}
      {modalEmBreve && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-sm text-center mx-4">
            <div className="w-40 h-40 mx-auto">
              <Lottie animationData={typing} loop />
            </div>
            <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight mt-2">
              Coisas boas estão chegando!
            </p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">
              A função de apoiar solicitações ainda está sendo desenvolvida.
            </p>
            <button
              onClick={() => setModalEmBreve(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
