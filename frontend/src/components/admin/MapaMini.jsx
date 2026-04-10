import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import Lottie from 'lottie-react'
import catLoading from '../../assets/CatLoading.json'
import api from '../../services/api'

const LIBRARIES = ['places', 'marker']
const CENTRO_PADRAO = { lat: -29.1678, lng: -51.1794 }
const ZOOM_PADRAO = 13
const ZOOM_FOCO = 17

const conteudoSVG = (svgStr, width, height) => {
  const div = document.createElement('div')
  div.innerHTML = svgStr
  div.style.width = `${width}px`
  div.style.height = `${height}px`
  return div
}

const pinSVG = (cor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 32 42">` +
  `<path d="M16 0C7.163 0 0 7.163 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.163 24.837 0 16 0Z" fill="${cor}"/>` +
  `<circle cx="16" cy="16" r="5" fill="white"/>` +
  `</svg>`

const pinSVGAnimado = (cor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="48" viewBox="0 0 32 52">` +
  `<g><animateTransform attributeName="transform" type="translate" values="0,10;0,0;0,10" dur="1.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>` +
  `<path d="M16 0C7.163 0 0 7.163 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.163 24.837 0 16 0Z" fill="${cor}"/>` +
  `<circle cx="16" cy="16" r="5" fill="white"/>` +
  `</g></svg>`

const clusterSVG = (count) => {
  const s = count < 10 ? 30 : count < 100 ? 36 : 42
  const fs = count < 10 ? 12 : 11
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">` +
    `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="#3cb478" stroke="white" stroke-width="3"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="700" font-size="${fs}" font-family="sans-serif">${count}</text>` +
    `</svg>`
}

export default function MapaMini({ focoSolicitacao }) {
  const navigate = useNavigate()
  const [solicitacoes, setSolicitacoes] = useState([])
  const [categorias, setCategorias] = useState({})
  const [mapa, setMapa] = useState(null)
  const [tilesCarregados, setTilesCarregados] = useState(false)
  const [dadosCarregados, setDadosCarregados] = useState(false)

  const clustererRef = useRef(null)
  const marcadoresPorIdRef = useRef({})
  const focoAnteriorIdRef = useRef(null)
  const idleListenerRef = useRef(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const carregando = !isLoaded || !tilesCarregados || !dadosCarregados

  useEffect(() => {
    let concluidos = 0
    const checar = () => { if (++concluidos === 2) setDadosCarregados(true) }

    api.get('/categorias').then((res) => {
      const obj = {}
      res.data.forEach((c) => { obj[c.id_categoria] = c })
      setCategorias(obj)
    }).catch(() => {}).finally(checar)

    api.get('/mapa/solicitacoes').then((res) => setSolicitacoes(res.data)).catch(() => {}).finally(checar)
  }, [])

  const marcadorKey = useMemo(
    () => solicitacoes.map((s) => `${s.id_solicitacao}:${s.id_categoria}`).join('|'),
    [solicitacoes]
  )

  useEffect(() => {
    if (!mapa) return
    if (clustererRef.current) clustererRef.current.clearMarkers()

    const porId = {}
    const novos = solicitacoes.map((sol) => {
      const c = categorias[sol.id_categoria]
      const cor = c?.cor_hex ?? '#3cb478'
      const m = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: sol.latitude, lng: sol.longitude },
        content: conteudoSVG(pinSVG(cor), 26, 34),
      })
      m._cor = cor
      m._id = sol.id_solicitacao
      m.addListener('gmp-click', () => {
        navigate(`/admin/solicitacoes?protocolo=${sol.protocolo}`)
      })
      porId[sol.id_solicitacao] = m
      return m
    })
    marcadoresPorIdRef.current = porId

    // Restaura animação do pin focado após re-render dos marcadores
    const idFocado = focoAnteriorIdRef.current
    if (idFocado && porId[idFocado]) {
      const m = porId[idFocado]
      m.content = conteudoSVG(pinSVGAnimado(m._cor), 30, 48)
    }

    clustererRef.current = new MarkerClusterer({
      map: mapa,
      markers: novos,
      renderer: {
        render({ count, position }) {
          const s = count < 10 ? 30 : count < 100 ? 36 : 42
          const content = conteudoSVG(clusterSVG(count), s, s)
          content.style.transform = 'translateY(50%)'
          return new window.google.maps.marker.AdvancedMarkerElement({
            position,
            content,
            zIndex: 1000,
          })
        },
      },
    })

    return () => { if (clustererRef.current) clustererRef.current.clearMarkers() }
  }, [mapa, marcadorKey, categorias, navigate])

  useEffect(() => {
    if (!mapa || !focoSolicitacao) return

    const marcadores = marcadoresPorIdRef.current

    // Restaura o pin anterior ao normal
    const idAnterior = focoAnteriorIdRef.current
    if (idAnterior && marcadores[idAnterior]) {
      const m = marcadores[idAnterior]
      m.content = conteudoSVG(pinSVG(m._cor), 26, 34)
    }

    // Anima o novo pin focado
    const idNovo = focoSolicitacao.id
    focoAnteriorIdRef.current = idNovo
    if (idNovo && marcadores[idNovo]) {
      const m = marcadores[idNovo]
      m.content = conteudoSVG(pinSVGAnimado(m._cor), 30, 48)
    }

    // Remove listener anterior para evitar acúmulo
    if (idleListenerRef.current) {
      window.google.maps.event.removeListener(idleListenerRef.current)
      idleListenerRef.current = null
    }

    const destino = { lat: focoSolicitacao.lat, lng: focoSolicitacao.lng }
    const zoomAtual = mapa.getZoom() ?? ZOOM_PADRAO

    if (zoomAtual < ZOOM_FOCO - 1) {
      // Já está num zoom baixo — pan direto e depois zoom
      mapa.panTo(destino)
      idleListenerRef.current = mapa.addListener('idle', () => {
        window.google.maps.event.removeListener(idleListenerRef.current)
        idleListenerRef.current = null
        mapa.setZoom(ZOOM_FOCO)
      })
    } else {
      // Está com zoom alto — zoom out, pan, zoom in
      mapa.setZoom(ZOOM_PADRAO)
      idleListenerRef.current = mapa.addListener('idle', () => {
        window.google.maps.event.removeListener(idleListenerRef.current)
        mapa.panTo(destino)
        idleListenerRef.current = mapa.addListener('idle', () => {
          window.google.maps.event.removeListener(idleListenerRef.current)
          idleListenerRef.current = null
          mapa.setZoom(ZOOM_FOCO)
        })
      })
    }
  }, [mapa, focoSolicitacao])

  const handleMapaLoad = useCallback((map) => {
    setMapa(map)
    map.addListener('tilesloaded', () => setTilesCarregados(true))
  }, [])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-black/8">
      {carregando && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-1">
          <div className="w-32 h-32">
            <Lottie animationData={catLoading} loop />
          </div>
          <p className="text-sm font-medium text-[#2a2a2a]/50">Carregando mapa...</p>
        </div>
      )}
      {isLoaded && (
        <GoogleMap
          mapContainerClassName="h-full w-full"
          center={CENTRO_PADRAO}
          zoom={ZOOM_PADRAO}
          onLoad={handleMapaLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: false,
            gestureHandling: 'cooperative',
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID',
          }}
        />
      )}
    </div>
  )
}
