import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Shield, Info } from 'lucide-react'
import api from '../../services/api'
import StatusContaBadge from '../../components/admin/StatusContaBadge'

const inputCls =
  'h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30 w-full'

function formatarCPF(cpf) {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function mapAdminParaLinha(a) {
  return { ...a, ja_e_admin: true }
}

export default function Usuarios() {
  const [aba, setAba] = useState('administradores')

  const [administradores, setAdministradores] = useState([])
  const [carregandoAdmins, setCarregandoAdmins] = useState(false)
  const [erroAdmins, setErroAdmins] = useState('')
  const [filtroAdminRascunho, setFiltroAdminRascunho] = useState('')
  const [filtroAdminAplicado, setFiltroAdminAplicado] = useState('')

  const [cpfBusca, setCpfBusca] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erroBusca, setErroBusca] = useState('')
  const [buscaRealizada, setBuscaRealizada] = useState(false)

  useEffect(() => {
    if (aba !== 'administradores') return
    setCarregandoAdmins(true)
    setErroAdmins('')
    api
      .get('/admin/usuarios/administradores')
      .then((res) => setAdministradores(res.data.map(mapAdminParaLinha)))
      .catch(() => {
        setErroAdmins('Não foi possível carregar a equipe.')
        setAdministradores([])
      })
      .finally(() => setCarregandoAdmins(false))
  }, [aba])

  const adminsFiltrados = useMemo(() => {
    const q = filtroAdminAplicado.trim().toLowerCase()
    if (!q) return administradores
    const qDigitos = q.replace(/\D/g, '')
    return administradores.filter((a) => {
      const nomeOk = a.nome_usuario.toLowerCase().includes(q)
      const emailOk = a.email.toLowerCase().includes(q)
      const cpfOk =
        qDigitos.length > 0 && a.cpf.replace(/\D/g, '').includes(qDigitos)
      return nomeOk || emailOk || cpfOk
    })
  }, [administradores, filtroAdminAplicado])

  const pesquisarAdministradores = () => {
    setFiltroAdminAplicado(filtroAdminRascunho.trim())
  }

  const limparFiltroAdministradores = () => {
    setFiltroAdminRascunho('')
    setFiltroAdminAplicado('')
  }

  const buscar = (e) => {
    e.preventDefault()
    const termo = cpfBusca.trim()
    if (!termo) return

    const ehEmail = termo.includes('@')
    const params = ehEmail
      ? `email=${encodeURIComponent(termo)}`
      : `cpf=${termo.replace(/\D/g, '')}`

    setCarregando(true)
    setErroBusca('')
    setBuscaRealizada(true)
    setUsuario(null)
    api
      .get(`/admin/usuarios/buscar?${params}`)
      .then((res) => setUsuario(res.data))
      .catch((err) => {
        const status = err?.response?.status
        setErroBusca(
          status === 404
            ? 'Nenhum usuário encontrado.'
            : status === 422
              ? (err?.response?.data?.detail ?? 'Valor inválido.')
              : 'Erro ao buscar usuário.',
        )
      })
      .finally(() => setCarregando(false))
  }

  const limpar = () => {
    setCpfBusca('')
    setUsuario(null)
    setErroBusca('')
    setBuscaRealizada(false)
  }

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setAba(id)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        aba === id
          ? 'bg-white text-[#2a2a2a] shadow-sm border border-black/8'
          : 'text-[#2a2a2a]/55 hover:text-[#2a2a2a]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Usuários</h1>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#2a2a2a]/5 w-fit border border-black/6">
        {tabBtn('administradores', 'Administradores')}
        {tabBtn('cidadaos', 'Cidadãos')}
      </div>

      {aba === 'administradores' && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              pesquisarAdministradores()
            }}
            className="bg-white border border-black/8 rounded-2xl p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 max-w-md">
                <input
                  value={filtroAdminRascunho}
                  onChange={(e) => setFiltroAdminRascunho(e.target.value)}
                  placeholder="Filtrar por nome, e-mail ou CPF…"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={limparFiltroAdministradores}
                disabled={!filtroAdminRascunho.trim() && !filtroAdminAplicado}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors shrink-0 disabled:pointer-events-none disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] transition-colors shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                Pesquisar
              </button>
            </div>
          </form>

          <div className="bg-white border border-black/8 rounded-2xl overflow-hidden">
            {carregandoAdmins ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-[#3cb478] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : erroAdmins ? (
              <p className="text-sm text-[#2a2a2a]/40 text-center py-16">{erroAdmins}</p>
            ) : adminsFiltrados.length === 0 ? (
              <p className="text-sm text-[#2a2a2a]/40 text-center py-16">
                {administradores.length === 0
                  ? 'Nenhum administrador cadastrado.'
                  : 'Nenhum resultado para o filtro.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-xs text-[#2a2a2a]/40 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 font-medium">CPF</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">E-mail</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cadastro</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {adminsFiltrados.map((u) => (
                    <tr key={u.id_usuario} className="border-b border-black/5 last:border-0 hover:bg-[#2a2a2a]/2 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#2a2a2a]">{u.nome_usuario}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#2a2a2a]/60">{formatarCPF(u.cpf)}</td>
                      <td className="px-4 py-3 text-[#2a2a2a]/60 hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-3 text-[#2a2a2a]/50 hidden lg:table-cell">{formatarData(u.data_cadastro)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3cb478]/40 bg-[#3cb478]/6 px-3 py-1 text-xs font-medium text-[#3cb478]">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatusContaBadge status={u.status_conta} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/usuarios/${u.id_usuario}`}
                          className="inline-block text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                        >
                          Gerenciar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {aba === 'cidadaos' && (
        <>
          <form onSubmit={buscar} className="space-y-4 bg-white border border-black/8 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/40">Busca de cidadão</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <Info className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-[#2a2a2a]/55">
                  Os dados de cidadãos não são listados automaticamente. Informe o CPF completo ou o e-mail cadastrado
                  para localizar uma pessoa quando necessário.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 max-w-md">
                <input
                  value={cpfBusca}
                  onChange={(e) => setCpfBusca(e.target.value)}
                  placeholder="Buscar por CPF ou e-mail"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={limpar}
                disabled={!cpfBusca.trim() && !buscaRealizada}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors shrink-0 disabled:pointer-events-none disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
              <button
                type="submit"
                disabled={carregando || !cpfBusca.trim()}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                Pesquisar
              </button>
            </div>
          </form>

          <div className="bg-white border border-black/8 rounded-2xl overflow-hidden shadow-sm">
            {!buscaRealizada ? (
              <p className="text-sm text-[#2a2a2a]/40 text-center py-16">
                Digite um CPF ou e-mail e clique em Pesquisar.
              </p>
            ) : carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-[#3cb478] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : erroBusca ? (
              <p className="text-sm text-[#2a2a2a]/40 text-center py-16">{erroBusca}</p>
            ) : usuario ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-xs text-[#2a2a2a]/40 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 font-medium">CPF</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">E-mail</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cadastro</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#2a2a2a]/2 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#2a2a2a]">{usuario.nome_usuario}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#2a2a2a]/60">{formatarCPF(usuario.cpf)}</td>
                    <td className="px-4 py-3 text-[#2a2a2a]/60 hidden md:table-cell">{usuario.email}</td>
                    <td className="px-4 py-3 text-[#2a2a2a]/50 hidden lg:table-cell">{formatarData(usuario.data_cadastro)}</td>
                    <td className="px-4 py-3">
                      {usuario.ja_e_admin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3cb478]/40 bg-[#3cb478]/6 px-3 py-1 text-xs font-medium text-[#3cb478]">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/3 px-3 py-1 text-xs font-medium text-[#2a2a2a]/55">
                          Cidadão
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusContaBadge status={usuario.status_conta} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/usuarios/${usuario.id_usuario}`}
                        className="inline-block text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
