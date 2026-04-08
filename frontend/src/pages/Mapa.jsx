import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { X, ThumbsUp, Lightbulb, Trash2, Accessibility, Construction, MapPin, Calendar, ChevronLeft, ChevronRight, LocateFixed } from 'lucide-react'
import api from '../services/api'
import Lottie from 'lottie-react'
import typing from '../assets/Typing.json'
import { STATUS_ICONE, STATUS_LABEL } from '../utils/solicitacaoStatus'

const LIBRARIES = ['places']

const iconeCategoria = (nome) => {
  if (nome?.includes('Iluminação')) return Lightbulb
  if (nome?.includes('Coleta'))     return Trash2
  if (nome?.includes('Acessib'))    return Accessibility
  if (nome?.includes('Manutenção')) return Construction
  return MapPin
}

const formatarData = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

const pinSVG = (cor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">` +
  `<path d="M16 0C7.163 0 0 7.163 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.163 24.837 0 16 0Z" fill="${cor}"/>` +
  `<circle cx="16" cy="16" r="5" fill="white"/>` +
  `</svg>`

const pinSVGAnimado = (cor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="52" viewBox="0 0 32 52">` +
  `<g><animateTransform attributeName="transform" type="translate" values="0,10;0,0;0,10" dur="1.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>` +
  `<path d="M16 0C7.163 0 0 7.163 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.163 24.837 0 16 0Z" fill="${cor}"/>` +
  `<circle cx="16" cy="16" r="5" fill="white"/>` +
  `</g></svg>`

const LOC_DOT_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">` +
  `<circle cx="18" cy="18" r="10" fill="#3b82f6" fill-opacity="0.3">` +
  `<animate attributeName="r" values="10;17;10" dur="1.8s" repeatCount="indefinite"/>` +
  `<animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="1.8s" repeatCount="indefinite"/>` +
  `</circle>` +
  `<circle cx="18" cy="18" r="7" fill="#3b82f6" stroke="white" stroke-width="2.5"/>` +
  `</svg>`

const clusterSVG = (count) => {
  const s = count < 10 ? 36 : count < 100 ? 42 : 48
  const fs = count < 10 ? 14 : 12
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">` +
    `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="#3cb478" stroke="white" stroke-width="3"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="700" font-size="${fs}" font-family="sans-serif">${count}</text>` +
    `</svg>`
}

const CENTRO_PADRAO = { lat: -29.1678, lng: -51.1794 }

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
  const [mapa, setMapa] = useState(null)
  const [pulseApoio, setPulseApoio] = useState(false)

  const clustererRef = useRef(null)
  const localizacaoMarkerRef = useRef(null)
  const posicaoCentradaRef = useRef(false)
  const marcadoresPorIdRef = useRef({})
  const anteriorSelecionadaRef = useRef(null)
  const selecionadaRef = useRef(null)
  const apoioPulseTimeoutRef = useRef(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosicao([pos.coords.latitude, pos.coords.longitude]),
      () => setPosicao([-29.1678, -51.1794])
    )
  }, [])

  useEffect(() => {
    api.get('/categorias').then((res) => {
      const obj = {}
      res.data.forEach((c) => { obj[c.id_categoria] = c })
      setCategorias(obj)
    }).catch(() => {})
    api.get('/mapa/solicitacoes').then((res) => setSolicitacoes(res.data)).catch(() => {})
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

  useEffect(() => { selecionadaRef.current = selecionada }, [selecionada])

  useEffect(() => {
    if (mapa && posicao && !posicaoCentradaRef.current) {
      mapa.setCenter({ lat: posicao[0], lng: posicao[1] })
      posicaoCentradaRef.current = true
    }
  }, [mapa, posicao])

  useEffect(() => {
    if (!mapa || !posicao) return
    if (localizacaoMarkerRef.current) localizacaoMarkerRef.current.setMap(null)
    localizacaoMarkerRef.current = new window.google.maps.Marker({
      position: { lat: posicao[0], lng: posicao[1] },
      map: mapa,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(LOC_DOT_SVG)}`,
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18),
      },
      clickable: false,
      zIndex: 500,
    })
    return () => { if (localizacaoMarkerRef.current) localizacaoMarkerRef.current.setMap(null) }
  }, [mapa, posicao])

  const solicitacoesFiltradas = useMemo(
    () => categoriaFiltro ? solicitacoes.filter((s) => s.id_categoria === categoriaFiltro) : solicitacoes,
    [solicitacoes, categoriaFiltro]
  )
  const marcadorKey = useMemo(
    () => solicitacoesFiltradas
      .map((s) => `${s.id_solicitacao}:${s.latitude}:${s.longitude}:${s.id_categoria}`)
      .join('|'),
    [solicitacoesFiltradas]
  )

  useEffect(() => {
    if (!mapa) return
    if (clustererRef.current) clustererRef.current.clearMarkers()

    const porId = {}
    const novos = solicitacoesFiltradas.map((sol) => {
      const c = categorias[sol.id_categoria]
      const cor = c?.cor_hex ?? '#3cb478'
      const m = new window.google.maps.Marker({
        position: { lat: sol.latitude, lng: sol.longitude },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVG(cor))}`,
          scaledSize: new window.google.maps.Size(32, 42),
          anchor: new window.google.maps.Point(16, 42),
        },
      })
      m._cor = cor
      m.addListener('click', () => setSelecionada(sol))
      porId[sol.id_solicitacao] = m
      return m
    })
    marcadoresPorIdRef.current = porId

    const idSelecionada = selecionadaRef.current?.id_solicitacao
    if (idSelecionada && porId[idSelecionada]) {
      porId[idSelecionada].setIcon({
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVGAnimado(porId[idSelecionada]._cor))}`,
        scaledSize: new window.google.maps.Size(32, 52),
        anchor: new window.google.maps.Point(16, 52),
      })
    }

    clustererRef.current = new MarkerClusterer({
      map: mapa,
      markers: novos,
      renderer: {
        render({ count, position }) {
          const s = count < 10 ? 36 : count < 100 ? 42 : 48
          return new window.google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(clusterSVG(count))}`,
              scaledSize: new window.google.maps.Size(s, s),
              anchor: new window.google.maps.Point(s / 2, s / 2),
            },
            zIndex: 1000,
          })
        },
      },
    })

    return () => { if (clustererRef.current) clustererRef.current.clearMarkers() }
  }, [mapa, marcadorKey, categorias])

  useEffect(() => {
    const marcadores = marcadoresPorIdRef.current

    if (anteriorSelecionadaRef.current && marcadores[anteriorSelecionadaRef.current]) {
      const m = marcadores[anteriorSelecionadaRef.current]
      m.setIcon({
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVG(m._cor))}`,
        scaledSize: new window.google.maps.Size(32, 42),
        anchor: new window.google.maps.Point(16, 42),
      })
    }

    anteriorSelecionadaRef.current = selecionada?.id_solicitacao ?? null

    if (!selecionada?.id_solicitacao) return
    const marker = marcadores[selecionada.id_solicitacao]
    if (!marker) return

    marker.setIcon({
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVGAnimado(marker._cor))}`,
      scaledSize: new window.google.maps.Size(32, 52),
      anchor: new window.google.maps.Point(16, 52),
    })
  }, [selecionada?.id_solicitacao])

  const handleMapaLoad = useCallback((map) => {
    setMapa(map)
    map.addListener('click', () => setSelecionada(null))
  }, [])

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
      desapoiarSolicitacao(selecionada.id_solicitacao)
    } else {
      setPulseApoio(true)
      if (apoioPulseTimeoutRef.current) clearTimeout(apoioPulseTimeoutRef.current)
      apoioPulseTimeoutRef.current = setTimeout(() => setPulseApoio(false), 150)
      apoiarSolicitacao(selecionada.id_solicitacao)
    }
  }

  useEffect(() => () => {
    if (apoioPulseTimeoutRef.current) clearTimeout(apoioPulseTimeoutRef.current)
  }, [])

  const cat = selecionada ? categorias[selecionada.id_categoria] : null
  const Icone = cat ? iconeCategoria(cat.nome_categoria) : MapPin
  const IconeStatus = STATUS_ICONE[selecionada?.status] ?? MapPin

  if (!isLoaded) return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3cb478] border-t-transparent" />
    </div>
  )

  const catsArr = Object.values(categorias)
  const opcoes = [
    { id: null, Icone: null, cor: null },
    ...catsArr.map((c) => ({ id: c.id_categoria, Icone: iconeCategoria(c.nome_categoria), cor: c.cor_hex })),
  ]
  const idxAtivo = opcoes.findIndex((o) => o.id === categoriaFiltro)
  const tamanho = 36
  const gap = 6

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={CENTRO_PADRAO}
        zoom={14}
        onLoad={handleMapaLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        }}
      />

      {/* Botão centralizar */}
      {posicao && (
        <button
          onClick={() => mapa?.setCenter({ lat: posicao[0], lng: posicao[1] })}
          className="absolute bottom-[72px] right-[10px] z-[1000] bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-2.5 text-[#2a2a2a]/60 hover:text-[#3cb478] transition-colors"
          title="Centralizar na minha localização"
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      )}

      {/* Filtro de categorias */}
      {catsArr.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm shadow-md rounded-full px-1.5 py-1.5">
          <div className="relative flex items-center" style={{ gap }}>
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
                    <div className="grid grid-cols-2 gap-px w-4 h-4 rounded-sm overflow-hidden">
                      {catsArr.slice(0, 4).map((c) => (
                        <div
                          key={c.id_categoria}
                          className="transition-opacity duration-300"
                          style={{ backgroundColor: c.cor_hex, opacity: ativo ? 1 : 0.25 }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      {selecionada && cat && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
          <div className="px-6 pt-5 pb-4 border-b border-black/5 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span
                    className="inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-3 py-1.5 text-sm font-medium text-[#2a2a2a]/70"
                    style={{ borderColor: cat.cor_hex }}
                  >
                    <Icone className="h-4 w-4 shrink-0" style={{ color: cat.cor_hex }} />
                    <span className="truncate">{cat.nome_categoria}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-3 py-1.5 text-sm font-medium text-[#2a2a2a]/70">
                    <IconeStatus className="h-4 w-4 text-[#2a2a2a]/55" aria-hidden />
                    {STATUS_LABEL[selecionada.status] ?? selecionada.status}
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

          <div className="overflow-y-auto">
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
                  className="flex items-center gap-2 hover:text-[#3cb478] transition-colors"
                  onClick={handleToggleApoio}
                >
                  <span
                    className={`inline-flex shrink-0 transition-[color,transform] duration-150 ease-out ${selecionada?.ja_apoiado ? 'text-[#3cb478]' : ''} ${pulseApoio ? 'scale-110' : 'scale-100'}`}
                  >
                    <ThumbsUp className="h-4 w-4" fill={selecionada?.ja_apoiado ? 'currentColor' : 'none'} />
                  </span>
                  <span>
                    {selecionada.contador_apoios} apoio{selecionada.contador_apoios !== 1 ? 's' : ''}
                  </span>
                </button>
              </div>
            </div>

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
          </div>
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
