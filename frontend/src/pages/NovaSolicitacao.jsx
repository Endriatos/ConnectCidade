import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Loader2, Camera, Upload, X, AlertTriangle, CheckCircle, Lightbulb, Trash2, Accessibility, Construction, Search, Pencil, LocateFixed } from 'lucide-react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import Header from '../components/Header'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function CapturarMapa({ mapaRef }) {
  const mapa = useMap()
  useEffect(() => { mapaRef.current = mapa }, [mapa, mapaRef])
  return null
}

function MapaEventos({ onMoveEnd }) {
  const debRef = useRef(null)
  useMapEvents({
    moveend: (e) => {
      clearTimeout(debRef.current)
      debRef.current = setTimeout(() => {
        const { lat, lng } = e.target.getCenter()
        onMoveEnd(lat, lng)
      }, 600)
    },
  })
  return null
}

const iconeCategoria = (nome) => {
  if (nome?.includes('Iluminação')) return Lightbulb
  if (nome?.includes('Coleta'))     return Trash2
  if (nome?.includes('Acessib'))    return Accessibility
  if (nome?.includes('Manutenção')) return Construction
  return MapPin
}

export default function NovaSolicitacao() {
  const navigate = useNavigate()

  // Campos do formulário
  const [categorias, setCategorias] = useState([])
  const [idCategoria, setIdCategoria] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [enderecoReferencia, setEnderecoReferencia] = useState('')
  const [fotos, setFotos] = useState([])
  const fotoInputRef = useRef(null)

  // Geolocalização
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle') // 'idle' | 'carregando' | 'ok' | 'erro'

  // Modal de mapa
  const [modalMapa, setModalMapa] = useState(false)
  const [posModal, setPosModal] = useState([-29.1678, -51.1794])
  const [enderecoModal, setEnderecoModal] = useState('')
  const [buscaModal, setBuscaModal] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [toastMapa, setToastMapa] = useState(null)
  const debounceRef = useRef(null)
  const mapaRef = useRef(null)

  // Controle de envio e duplicata
  const [solicitacaoCriada, setSolicitacaoCriada] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [uploadProgresso, setUploadProgresso] = useState(null) // '2/3' ou null
  const [avisDuplicata, setAvisDuplicata] = useState(null)
  const [erros, setErros] = useState({})

  // Busca categorias do backend
  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {})
  }, [])

  const capturarLocalizacao = () => {
    if (!navigator.geolocation) {
      setGeoStatus('erro')
      return
    }
    setGeoStatus('carregando')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lon)
        setGeoStatus('ok')
        // Geocodificação reversa via Nominatim (OpenStreetMap)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          )
          const data = await res.json()
          const addr = data.address
          const partes = [
            addr.road,
            addr.house_number,
            addr.suburb ?? addr.neighbourhood,
          ].filter(Boolean)
          setEnderecoReferencia(partes.join(', ') || data.display_name)
        } catch {
          // Se a geocodificação falhar, mantém o campo como está
        }
      },
      () => setGeoStatus('erro'),
    )
  }

  // Tenta capturar localização ao montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { capturarLocalizacao() }, [])

  const geocodificarEndereco = async (endereco) => {
    if (!endereco.trim() || geoStatus === 'ok') return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        setLatitude(parseFloat(data[0].lat))
        setLongitude(parseFloat(data[0].lon))
      }
    } catch {
      // mantém fallback se geocodificação falhar
    }
  }

  const geocodificacaoReversa = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      )
      const data = await res.json()
      const addr = data.address
      const partes = [addr.road, addr.house_number, addr.suburb ?? addr.neighbourhood].filter(Boolean)
      return partes.join(', ') || data.display_name
    } catch {
      return ''
    }
  }

  const mostrarToast = (msg, tipo = 'sucesso') => {
    setToastMapa({ msg, tipo })
    setTimeout(() => setToastMapa(null), 2500)
  }

  const abrirModalMapa = async () => {
    const lat = latitude ?? -29.1678
    const lng = longitude ?? -51.1794
    setPosModal([lat, lng])
    setSugestoes([])
    setBuscaModal(enderecoReferencia)
    const end = enderecoReferencia || await geocodificacaoReversa(lat, lng)
    setEnderecoModal(end)
    setModalMapa(true)
  }

  const handleDragEnd = async (e) => {
    const { lat, lng } = e.target.getLatLng()
    setPosModal([lat, lng])
    const end = await geocodificacaoReversa(lat, lng)
    setEnderecoModal(end)
    setBuscaModal(end)
  }

  const handleBuscaChange = (val) => {
    setBuscaModal(val)
    setSugestoes([])
    clearTimeout(debounceRef.current)
    if (val.trim().length < 3) return
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&street=${encodeURIComponent(val)}&city=Caxias%20do%20Sul&state=RS&country=Brazil&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        )
        const data = await res.json()
        setSugestoes(data)
      } catch {}
    }, 400)
  }

  const selecionarSugestao = (s) => {
    setEnderecoModal(s.display_name)
    setBuscaModal(s.display_name)
    setSugestoes([])
    if (mapaRef.current) mapaRef.current.setView([parseFloat(s.lat), parseFloat(s.lon)], 16)
  }

  const obterLocalizacaoAtual = () => {
    if (!navigator.geolocation) {
      mostrarToast('GPS não disponível neste dispositivo', 'erro')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (mapaRef.current) mapaRef.current.setView([lat, lng], 16)
        const end = await geocodificacaoReversa(lat, lng)
        setEnderecoModal(end)
        setBuscaModal(end)
        mostrarToast('Localização obtida com sucesso!')
      },
      () => mostrarToast('Não foi possível obter a localização', 'erro')
    )
  }

  const confirmarPosicaoMapa = () => {
    if (!mapaRef.current) return
    const center = mapaRef.current.getCenter()
    setLatitude(center.lat)
    setLongitude(center.lng)
    setEnderecoReferencia(enderecoModal)
    setGeoStatus('manual')
    setModalMapa(false)
  }

  const handleAdicionarFoto = (e) => {
    const arquivos = Array.from(e.target.files)
    setFotos((prev) => [...prev, ...arquivos].slice(0, 5))
    setErros((p) => ({ ...p, fotos: '' }))
    e.target.value = ''
  }

  const abrirGaleria = () => {
    fotoInputRef.current.removeAttribute('capture')
    fotoInputRef.current.click()
  }

  const abrirCamera = () => {
    fotoInputRef.current.setAttribute('capture', 'environment')
    fotoInputRef.current.click()
  }

  const handleRemoverFoto = (index) => {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  const enviarSolicitacao = async (confirmarDuplicata = false) => {
    setErros({})
    setEnviando(true)
    setUploadProgresso(null)
    try {
      // POST /solicitacoes em multipart: campos + fotos (obrigatório no back-end; mesmo nome "fotos" para cada arquivo)
      const form = new FormData()
      form.append('id_categoria', String(idCategoria))
      form.append('descricao', descricao)
      form.append('endereco_referencia', enderecoReferencia)
      form.append('latitude', String(latitude ?? -29.1678))
      form.append('longitude', String(longitude ?? -51.1794))
      form.append('confirmar_duplicata', confirmarDuplicata ? 'true' : 'false')
      fotos.forEach((f) => form.append('fotos', f))

      // Não definir Content-Type manualmente: o axios define multipart com boundary ao enviar FormData
      const res = await api.post('/solicitacoes', form)

      // Duplicata: API retorna 200 com { aviso, protocolo, ... } sem criar solicitação até o usuário confirmar
      if (res.data.aviso) {
        setAvisDuplicata(res.data)
        return
      }

      const categoriaSelecionada = categorias.find((c) => c.id_categoria === idCategoria)
      setSolicitacaoCriada({ ...res.data, nome_categoria: categoriaSelecionada?.nome_categoria })
    } catch {
      setErros({ geral: 'Não foi possível enviar a solicitação. Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const novosErros = {}
    if (!idCategoria)                 novosErros.categoria = 'Selecione uma categoria.'
    if (!descricao.trim())            novosErros.descricao = 'Descreva o problema.'
    if (!enderecoReferencia.trim())   novosErros.endereco  = 'Informe o endereço.'
    if (fotos.length === 0)           novosErros.fotos     = 'Adicione pelo menos uma foto.'
    if (Object.keys(novosErros).length) return setErros(novosErros)
    enviarSolicitacao(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">

      {/* Modal — seleção de localização no mapa */}
      {modalMapa && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col" style={{ height: '80vh' }}>

            {/* Cabeçalho com busca e sugestões */}
            <div className="shrink-0 relative">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]/8">
                <div className="flex flex-1 items-center rounded-xl border border-[#2a2a2a]/10 focus-within:ring-2 focus-within:ring-[#3cb478]/30 overflow-hidden">
                  <Search className="h-4 w-4 text-[#2a2a2a]/30 ml-3 shrink-0" />
                  <input
                    type="text"
                    id="busca-endereco"
                    name="busca-endereco"
                    placeholder="Pesquisar endereço em Caxias do Sul..."
                    value={buscaModal}
                    onChange={(e) => handleBuscaChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setSugestoes([])}
                    className="flex-1 px-3 py-2 text-sm text-[#2a2a2a] placeholder-[#2a2a2a]/30 bg-transparent focus:outline-none"
                  />
                  {buscaModal && (
                    <button onClick={() => { setBuscaModal(''); setSugestoes([]) }} className="px-2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button onClick={() => { setModalMapa(false); setSugestoes([]) }} className="shrink-0 text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dropdown de sugestões */}
              {sugestoes.length > 0 && (
                <div className="absolute left-4 right-4 top-full z-[3000] bg-white rounded-xl border border-[#2a2a2a]/10 shadow-lg overflow-hidden">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selecionarSugestao(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#2a2a2a] hover:bg-[#f5f5f5] border-b border-[#2a2a2a]/5 last:border-0 truncate"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mapa */}
            <div className="flex-1 relative overflow-hidden">
              <MapContainer center={posModal} zoom={16} className="h-full w-full" zoomControl={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CapturarMapa mapaRef={mapaRef} />
                <MapaEventos onMoveEnd={async (lat, lng) => {
                  const end = await geocodificacaoReversa(lat, lng)
                  setEnderecoModal(end)
                  setBuscaModal(end)
                }} />
              </MapContainer>

              {/* Pin fixo no centro */}
              <div className="absolute top-1/2 left-1/2 z-[1000] pointer-events-none" style={{ transform: 'translate(-50%, -100%)' }}>
                <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="#3cb478"/>
                  <circle cx="14" cy="14" r="5" fill="white"/>
                </svg>
              </div>

              {/* Toast */}
              {toastMapa && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-[4000] px-4 py-2 rounded-xl text-sm font-medium shadow-md whitespace-nowrap ${toastMapa.tipo === 'sucesso' ? 'bg-[#3cb478] text-white' : 'bg-red-500 text-white'}`}>
                  {toastMapa.msg}
                </div>
              )}

              {/* Botão localização atual */}
              <button
                onClick={obterLocalizacaoAtual}
                title="Usar minha localização atual"
                className="absolute bottom-4 right-4 z-[1000] bg-white rounded-xl shadow-md p-2.5 text-[#2a2a2a]/60 hover:text-[#3cb478] transition-colors"
              >
                <LocateFixed className="h-5 w-5" />
              </button>
            </div>

            {/* Rodapé */}
            <div className="shrink-0 px-4 py-3 border-t border-[#2a2a2a]/8">
              {enderecoModal && (
                <p className="text-xs text-[#2a2a2a]/50 mb-2 truncate">{enderecoModal}</p>
              )}
              <button
                onClick={confirmarPosicaoMapa}
                className="w-full py-2.5 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] transition-colors"
              >
                Confirmar localização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — aviso de duplicata */}
      {avisDuplicata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-orange-400 px-8 py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-50">
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
                  Possível duplicata encontrada
                </p>
                <p className="mt-2 text-sm text-[#2a2a2a]/50 leading-relaxed">
                  {avisDuplicata.aviso}
                </p>
                <p className="mt-1 text-xs text-[#2a2a2a]/40">
                  Protocolo existente: #{avisDuplicata.protocolo}
                </p>
              </div>
              <div className="w-full flex flex-col gap-2 mt-2">
                <button
                  onClick={() => { setAvisDuplicata(null); navigate('/home') }}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setAvisDuplicata(null); enviarSolicitacao(true) }}
                  className="w-full py-3 rounded-xl border border-[#2a2a2a]/10 text-sm text-[#2a2a2a]/50 hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  Registrar mesmo assim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — solicitação criada com sucesso */}
      {solicitacaoCriada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#3cb478]/10">
                <CheckCircle className="h-8 w-8 text-[#3cb478]" />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
                  Solicitação registrada!
                </p>
                <p className="mt-2 text-sm text-[#2a2a2a]/50 leading-relaxed">
                  Sua solicitação foi enviada e será analisada em breve.
                </p>
              </div>
              <div className="w-full rounded-xl bg-[#f5f5f5] px-5 py-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2a2a2a]/50">Protocolo</span>
                  <span className="font-medium text-[#2a2a2a]">#{solicitacaoCriada.protocolo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2a2a2a]/50">Categoria</span>
                  <span className="font-medium text-[#2a2a2a]">{solicitacaoCriada.nome_categoria}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2a2a2a]/50">Status</span>
                  <span className="font-medium text-[#2a2a2a]">Pendente</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/home')}
                className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      {/* Formulário */}
      <main className="flex-1 py-8">
        <div className="mx-auto px-4 w-full max-w-2xl">
          <div className="bg-white rounded-2xl border border-[#2a2a2a]/8 shadow-sm p-8">

            <h1 className="text-2xl font-semibold text-[#2a2a2a]">Registrar Problema</h1>
            <p className="text-sm text-[#2a2a2a]/50 mt-1 mb-8">
              Nos conte o que aconteceu para encaminharmos ao setor responsável
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-[#2a2a2a] mb-3">
                  Categoria <span className="text-red-400">*</span>
                </label>
                {erros.categoria && <p className="text-xs text-red-500 mb-2">{erros.categoria}</p>}
                <div className={`grid grid-cols-2 gap-3 rounded-xl transition-all ${erros.categoria ? 'ring-2 ring-red-300 p-1' : ''}`}>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id_categoria}
                      type="button"
                      onClick={() => { setIdCategoria(cat.id_categoria); setErros((p) => ({ ...p, categoria: '' })) }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                      style={{
                        borderColor: idCategoria === cat.id_categoria ? cat.cor_hex : '#e5e5e5',
                        backgroundColor: idCategoria === cat.id_categoria ? `${cat.cor_hex}10` : 'white',
                      }}
                    >
                      {(() => { const Icone = iconeCategoria(cat.nome_categoria); return <Icone className="h-6 w-6" style={{ color: cat.cor_hex }} /> })()}
                      <span className="text-sm font-medium text-[#2a2a2a] text-center leading-tight">
                        {cat.nome_categoria}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-[#2a2a2a] mb-2">
                  Descrição <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="descricao"
                  rows={4}
                  placeholder="Descreva o problema com detalhes..."
                  value={descricao}
                  onChange={(e) => { setDescricao(e.target.value); setErros((p) => ({ ...p, descricao: '' })) }}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-[#2a2a2a] placeholder-[#2a2a2a]/30 focus:outline-none focus:ring-2 resize-none transition-colors ${erros.descricao ? 'border-red-300 focus:ring-red-200' : 'border-[#2a2a2a]/10 focus:ring-[#3cb478]/30'}`}
                />
                {erros.descricao && <p className="text-xs text-red-500 mt-1">{erros.descricao}</p>}
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                  Endereço <span className="text-red-400">*</span>
                </label>
                {erros.endereco && <p className="text-xs text-red-500 mb-1">{erros.endereco}</p>}
                <div className={`flex items-center rounded-xl border ${erros.endereco ? 'border-red-300' : 'border-[#2a2a2a]/10'}`}>
                  <p onClick={abrirModalMapa} className="flex-1 px-4 py-3 text-sm text-[#2a2a2a] truncate cursor-pointer">
                    {enderecoReferencia || <span className="text-[#2a2a2a]/30">Nenhuma localização selecionada</span>}
                  </p>
                  <button
                    type="button"
                    onClick={abrirModalMapa}
                    title="Editar localização"
                    className="pr-3 pl-2 text-[#2a2a2a]/30 hover:text-[#3cb478] transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {geoStatus === 'ok' && (
                  <div className="flex items-center gap-2 text-sm text-[#3cb478] bg-[#3cb478]/8 px-4 py-3 rounded-xl mt-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Localização obtida automaticamente
                  </div>
                )}
                {geoStatus === 'erro' && (
                  <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-50 px-4 py-3 rounded-xl mt-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    Não foi possível obter a localização automaticamente
                  </div>
                )}
              </div>

              {/* Fotos */}
              <div>
                <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                  Fotos <span className="text-[#2a2a2a]/40 font-normal">(mín. 1, máx. 5)</span> <span className="text-red-400">*</span>
                </label>
                {erros.fotos && <p className="text-xs text-red-500 mb-2">{erros.fotos}</p>}
                <div className={`flex gap-3 mb-3 ${erros.fotos ? 'ring-2 ring-red-300 rounded-xl p-1' : ''}`}>
                  <button
                    type="button"
                    onClick={abrirGaleria}
                    disabled={fotos.length >= 5}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 disabled:opacity-40 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Galeria
                  </button>
                  <button
                    type="button"
                    onClick={abrirCamera}
                    disabled={fotos.length >= 5}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 disabled:opacity-40 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Câmera
                  </button>
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdicionarFoto}
                  className="hidden"
                />
                {fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {fotos.map((foto, i) => (
                      <div key={i} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(foto)}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoverFoto(i)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {erros.geral && (
                <p className="text-sm text-red-500">{erros.geral}</p>
              )}


              {/* Botão enviar */}
              <button
                type="submit"
                disabled={enviando}
                className="w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium hover:bg-[#349d69] disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgresso ? `Enviando foto ${uploadProgresso}...` : 'Enviando...'}
                  </>
                ) : 'Enviar Solicitação'}
              </button>

            </form>
          </div>
        </div>
      </main>

    </div>
  )
}
