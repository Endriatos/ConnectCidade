import { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import Card from '../components/minhasSolicitacoes/card/Card'
import Carregando from '../components/minhasSolicitacoes/card/Carregando'
import Erro from '../components/minhasSolicitacoes/card/Erro'
import VazioLista from '../components/minhasSolicitacoes/card/VazioLista'
import Filtro from '../components/minhasSolicitacoes/filtro/Filtro'
import SemResultados from '../components/minhasSolicitacoes/filtro/SemResultados'
import api from '../services/api'

const MENSAGEM_ERRO_LISTA = 'Não foi possível carregar suas solicitações.'

function filtrarItens(itens, statusFiltro, categoriaFiltro) {
  return itens.filter(
    (s) =>
      (statusFiltro === 'TODOS' || s.status === statusFiltro) &&
      (categoriaFiltro === null || s.id_categoria === categoriaFiltro),
  )
}

function ListaMinhasSolicitacoes({ categoriasPorId }) {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    let redirecionarSessao = false
    try {
      const res = await api.get('/solicitacoes/minhas')
      const payload = res.data
      const lista = Array.isArray(payload) ? payload : []
      setItens(lista)
    } catch (e) {
      if (e?.message === 'sessao_expirada' || e?.response?.status === 401) {
        redirecionarSessao = true
        return
      }
      setErro(MENSAGEM_ERRO_LISTA)
    } finally {
      if (!redirecionarSessao) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={() => void carregar()} />
  if (itens.length === 0) return <VazioLista />

  const visiveis = filtrarItens(itens, statusFiltro, categoriaFiltro)
  const categoriasDisponiveis = Object.values(categoriasPorId)

  return (
    <div className="w-full pb-6">
      <Filtro
        statusFiltro={statusFiltro}
        onStatusFiltroChange={setStatusFiltro}
        categoriaFiltro={categoriaFiltro}
        onCategoriaFiltroChange={setCategoriaFiltro}
        categoriasDisponiveis={categoriasDisponiveis}
      />
      <div className="pb-3 pt-2">
        <p className="mb-2 text-xs text-[#2a2a2a]/45">
          Exibindo {visiveis.length} de {itens.length} solicitações
        </p>
        <ul className="m-0 list-none space-y-4 p-0">
          {visiveis.map((s) => (
            <li key={s.id_solicitacao}>
              <Card solicitacao={s} categoria={categoriasPorId[s.id_categoria]} />
            </li>
          ))}
        </ul>
        {visiveis.length === 0 && <SemResultados />}
      </div>
    </div>
  )
}

export default function MinhasSolicitacoes() {
  const [categoriasPorId, setCategoriasPorId] = useState({})

  useEffect(() => {
    api
      .get('/categorias')
      .then((res) => {
        setCategoriasPorId(
          Object.fromEntries(res.data.map((c) => [c.id_categoria, c])),
        )
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2a2a2a]">Minhas solicitações</h1>
            <p className="mt-0.5 text-sm text-[#2a2a2a]/50">
              Acompanhe o status e o histórico dos problemas que você registrou.
            </p>
          </div>
          <ListaMinhasSolicitacoes categoriasPorId={categoriasPorId} />
        </div>
      </main>
    </div>
  )
}
