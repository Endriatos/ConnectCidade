import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ChevronDown, LogOut, MapPin, Loader2, Camera, Upload, X, AlertTriangle, RefreshCw, CheckCircle, Lightbulb, Trash2, Accessibility, Construction } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import logoCC from '../assets/logoCC.png'
import Lottie from 'lottie-react'
import typing from '../assets/Typing.json'

const iconeCategoria = (nome) => {
  if (nome?.includes('Iluminação')) return Lightbulb
  if (nome?.includes('Coleta'))     return Trash2
  if (nome?.includes('Acessib'))    return Accessibility
  if (nome?.includes('Manutenção')) return Construction
  return MapPin
}

export default function NovaSolicitacao() {
  const { nome, logout } = useAuthStore()
  const navigate = useNavigate()

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

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

  // Controle de envio e duplicata
  const [modalFoto, setModalFoto] = useState(false)
  const [solicitacaoCriada, setSolicitacaoCriada] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [avisDuplicata, setAvisDuplicata] = useState(null)
  const [erros, setErros] = useState({})

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

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

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleAdicionarFoto = (e) => {
    const arquivos = Array.from(e.target.files)
    setFotos((prev) => {
      const novas = [...prev, ...arquivos].slice(0, 5)
      return novas
    })
    e.target.value = ''
  }

  const handleRemoverFoto = (index) => {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  const enviarSolicitacao = async (confirmarDuplicata = false) => {
    setErros({})
    setEnviando(true)
    try {
      const res = await api.post('/solicitacoes', {
        id_categoria: idCategoria,
        descricao,
        endereco_referencia: enderecoReferencia,
        latitude: latitude ?? -29.1678,
        longitude: longitude ?? -51.1794,
        confirmar_duplicata: confirmarDuplicata,
      })

      if (res.data.aviso) {
        setAvisDuplicata(res.data)
        return
      }

      // Enriquece com o nome da categoria para exibir no modal
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
    if (Object.keys(novosErros).length) return setErros(novosErros)
    enviarSolicitacao(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">

      {/* Modal — upload de fotos em breve */}
      {modalFoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModalFoto(false) }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-8">
            <button
              onClick={() => setModalFoto(false)}
              className="absolute top-4 right-4 text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <Lottie animationData={typing} loop autoplay style={{ width: 180, height: 180 }} />
              <div>
                <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
                  Coisas boas estão chegando!
                </p>
                <p className="mt-2 text-sm text-[#2a2a2a]/55 leading-relaxed">
                  Ainda estamos trabalhando nisso. Em breve você poderá anexar fotos às suas solicitações.
                </p>
              </div>
              <button
                onClick={() => setModalFoto(false)}
                className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
              >
                Entendido
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

      {/* Header — igual ao Home */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/home" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
            >
              <User className="h-4 w-4 text-[#2a2a2a]/40" />
              {primeiroNome}
              <ChevronDown className="h-3.5 w-3.5 text-[#2a2a2a]/40" />
            </button>
            {menuAberto && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-[#2a2a2a]/40" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
                <label htmlFor="endereco" className="block text-sm font-medium text-[#2a2a2a] mb-2">
                  Endereço <span className="text-red-400">*</span>
                </label>
                {erros.endereco && <p className="text-xs text-red-500 mb-1">{erros.endereco}</p>}
                <div className={`flex items-center rounded-xl border focus-within:ring-2 transition-colors ${erros.endereco ? 'border-red-300 focus-within:ring-red-200' : 'border-[#2a2a2a]/10 focus-within:ring-[#3cb478]/30'}`}>
                  <input
                    id="endereco"
                    type="text"
                    placeholder="Ex: Rua XV de Novembro, 320"
                    value={enderecoReferencia}
                    onChange={(e) => { setEnderecoReferencia(e.target.value); setErros((p) => ({ ...p, endereco: '' })) }}
                    className="flex-1 px-4 py-3 text-sm text-[#2a2a2a] placeholder-[#2a2a2a]/30 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={capturarLocalizacao}
                    disabled={geoStatus === 'carregando'}
                    title="Atualizar localização"
                    className="pr-3 pl-2 text-[#2a2a2a]/30 hover:text-[#3cb478] disabled:opacity-40 transition-colors"
                  >
                    {geoStatus === 'carregando'
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <RefreshCw className="h-4 w-4" />
                    }
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
                    Não foi possível obter a localização
                  </div>
                )}
              </div>

              {/* Fotos */}
              <div>
                <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                  Fotos <span className="text-[#2a2a2a]/40 font-normal">(mín. 1, máx. 5)</span>
                </label>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setModalFoto(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Galeria
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalFoto(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
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
                    Enviando...
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
