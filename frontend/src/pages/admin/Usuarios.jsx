import { useEffect, useMemo, useState } from 'react'
import { Search, X, Shield, ShieldOff, Mail, UserCircle, Info, CircleUser } from 'lucide-react'
import api from '../../services/api'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const STATUS_CONTA = {
  0: { label: 'Pendente',  cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  1: { label: 'Ativada',   cls: 'border-[#3cb478]/40 bg-[#3cb478]/6 text-[#3cb478]' },
  2: { label: 'Bloqueada', cls: 'border-red-200 bg-red-50 text-red-600' },
}

function BadgeEstado({ status }) {
  const cfg = STATUS_CONTA[status] ?? STATUS_CONTA[0]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
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

  const [selecionado, setSelecionado] = useState(null)
  const [emailNovo, setEmailNovo] = useState('')
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [erroEmail, setErroEmail] = useState('')
  const [sucessoEmail, setSucessoEmail] = useState(false)
  const [promovendo, setPromovendo] = useState(false)
  const [confirmandoAdmin, setConfirmandoAdmin] = useState(false)
  const [erroAdmin, setErroAdmin] = useState('')
  const [sucessoAdmin, setSucessoAdmin] = useState('')

  const [statusNovo, setStatusNovo] = useState(1)
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [erroStatus, setErroStatus] = useState('')
  const [sucessoStatus, setSucessoStatus] = useState('')

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

  const atualizarUsuarioEmListas = (atualizado) => {
    if (usuario && usuario.id_usuario === atualizado.id_usuario) setUsuario(atualizado)
    setAdministradores((prev) => {
      const idx = prev.findIndex((a) => a.id_usuario === atualizado.id_usuario)
      if (atualizado.ja_e_admin) {
        const linha = mapAdminParaLinha({
          id_usuario: atualizado.id_usuario,
          nome_usuario: atualizado.nome_usuario,
          email: atualizado.email,
          cpf: atualizado.cpf,
          data_cadastro: atualizado.data_cadastro,
          status_conta: atualizado.status_conta,
        })
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = linha
          return next
        }
        return [...prev, linha]
      }
      if (idx >= 0) {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      }
      return prev
    })
  }

  const abrirModal = (u) => {
    setSelecionado(u)
    setEmailNovo(u.email)
    setErroEmail('')
    setSucessoEmail(false)
    setConfirmandoAdmin(false)
    setErroAdmin('')
    setSucessoAdmin('')
    setStatusNovo(u.status_conta ?? 1)
    setErroStatus('')
    setSucessoStatus('')
  }

  const fecharModal = () => {
    setSelecionado(null)
    setEmailNovo('')
    setErroEmail('')
    setSucessoEmail(false)
    setConfirmandoAdmin(false)
    setErroAdmin('')
    setSucessoAdmin('')
    setStatusNovo(1)
    setErroStatus('')
    setSucessoStatus('')
  }

  const salvarEmail = () => {
    if (!emailNovo.trim() || emailNovo === selecionado.email) return
    if (!REGEX_EMAIL.test(emailNovo.trim())) {
      setErroEmail('Digite um e-mail válido.')
      return
    }
    setSalvandoEmail(true)
    setErroEmail('')
    setSucessoEmail(false)
    api
      .patch(`/admin/usuarios/${selecionado.id_usuario}/email`, { email: emailNovo.trim() })
      .then(() => {
        const atualizado = { ...selecionado, email: emailNovo.trim() }
        setSelecionado(atualizado)
        atualizarUsuarioEmListas(atualizado)
        setSucessoEmail(true)
      })
      .catch((err) => setErroEmail(err?.response?.data?.detail ?? 'Erro ao salvar e-mail.'))
      .finally(() => setSalvandoEmail(false))
  }

  const toggleAdmin = () => {
    const promovendo_ = !selecionado.ja_e_admin
    const acao = selecionado.ja_e_admin ? 'revogar' : 'promover'
    setPromovendo(true)
    setErroAdmin('')
    setSucessoAdmin('')
    api
      .patch(`/admin/usuarios/${selecionado.id_usuario}/${acao}`)
      .then(() => {
        const atualizado = { ...selecionado, ja_e_admin: !selecionado.ja_e_admin }
        setSelecionado(atualizado)
        atualizarUsuarioEmListas(atualizado)
        setSucessoAdmin(
          promovendo_ ? 'Usuário promovido a administrador.' : 'Acesso de administrador revogado.',
        )
      })
      .catch((err) => setErroAdmin(err?.response?.data?.detail ?? 'Erro ao alterar permissões.'))
      .finally(() => {
        setPromovendo(false)
        setConfirmandoAdmin(false)
      })
  }

  const salvarStatus = () => {
    if (statusNovo === selecionado.status_conta) return
    setAlterandoStatus(true)
    setErroStatus('')
    setSucessoStatus('')
    api
      .patch(`/admin/usuarios/${selecionado.id_usuario}/status-conta`, { status_conta: statusNovo })
      .then(() => {
        const atualizado = { ...selecionado, status_conta: statusNovo }
        setSelecionado(atualizado)
        atualizarUsuarioEmListas(atualizado)
        setSucessoStatus(`Estado alterado para ${STATUS_CONTA[statusNovo].label}.`)
      })
      .catch((err) => setErroStatus(err?.response?.data?.detail ?? 'Erro ao alterar estado.'))
      .finally(() => setAlterandoStatus(false))
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
                        <BadgeEstado status={u.status_conta} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => abrirModal(u)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                        >
                          Gerenciar
                        </button>
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
              <div className="mt-1.5 flex items-start gap-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40" aria-hidden />
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
                      <BadgeEstado status={usuario.status_conta} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => abrirModal(usuario)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        </>
      )}

      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-black/8 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#3cb478]/10 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-[#3cb478]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#2a2a2a]">{selecionado.nome_usuario}</p>
                  <p className="font-mono text-xs text-[#2a2a2a]/40 mt-0.5">{formatarCPF(selecionado.cpf)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharModal}
                className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailNovo}
                    onChange={(e) => {
                      setEmailNovo(e.target.value)
                      setSucessoEmail(false)
                      setErroEmail('')
                    }}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={salvarEmail}
                    disabled={salvandoEmail || !emailNovo.trim() || emailNovo === selecionado.email}
                    className="h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
                  >
                    {salvandoEmail ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                {erroEmail && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {erroEmail}
                  </p>
                )}
                {sucessoEmail && (
                  <p className="text-xs text-[#3cb478] bg-[#3cb478]/8 border border-[#3cb478]/20 rounded-xl px-3 py-2">
                    E-mail atualizado com sucesso.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Permissões
                </p>
                <div className="rounded-xl border border-black/8 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2a2a2a]">
                        {selecionado.ja_e_admin ? 'Administrador' : 'Cidadão'}
                      </p>
                      <p className="text-xs text-[#2a2a2a]/40 mt-0.5">
                        {selecionado.ja_e_admin
                          ? 'Acesso total ao painel administrativo'
                          : 'Acesso apenas às funcionalidades de cidadão'}
                      </p>
                    </div>
                    {!confirmandoAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmandoAdmin(true)
                          setErroAdmin('')
                          setSucessoAdmin('')
                        }}
                        className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium border transition-colors shrink-0 ml-4 ${
                          selecionado.ja_e_admin
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8'
                        }`}
                      >
                        {selecionado.ja_e_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                        {selecionado.ja_e_admin ? 'Revogar' : 'Promover'}
                      </button>
                    )}
                  </div>
                  {confirmandoAdmin && (
                    <div className="flex items-center justify-between rounded-lg bg-[#2a2a2a]/4 px-3 py-2">
                      <p className="text-xs text-[#2a2a2a]/70">
                        {selecionado.ja_e_admin ? 'Revogar acesso de administrador?' : 'Promover a administrador?'}
                      </p>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => setConfirmandoAdmin(false)}
                          disabled={promovendo}
                          className="h-7 px-3 rounded-lg text-xs text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/8 transition-colors disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={toggleAdmin}
                          disabled={promovendo}
                          className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                            selecionado.ja_e_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3cb478] hover:bg-[#349d69]'
                          }`}
                        >
                          {promovendo && (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          )}
                          {promovendo ? 'Aguarde...' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {erroAdmin && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {erroAdmin}
                  </p>
                )}
                {sucessoAdmin && (
                  <p className="text-xs text-[#3cb478] bg-[#3cb478]/8 border border-[#3cb478]/20 rounded-xl px-3 py-2">
                    {sucessoAdmin}
                  </p>
                )}
              </div>

              {!selecionado.is_master && <div className="space-y-2">
                <p className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <CircleUser className="h-3.5 w-3.5" />
                  Estado da conta
                </p>
                <div className="rounded-xl border border-black/8 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#2a2a2a]">
                        {STATUS_CONTA[selecionado.status_conta]?.label ?? '—'}
                      </p>
                      <p className="text-xs text-[#2a2a2a]/40 mt-0.5">Estado atual da conta</p>
                    </div>
                    <select
                      value={statusNovo}
                      onChange={(e) => { setStatusNovo(Number(e.target.value)); setSucessoStatus(''); setErroStatus('') }}
                      className="h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 shrink-0"
                    >
                      <option value={0}>Pendente</option>
                      <option value={1}>Ativada</option>
                      <option value={2}>Bloqueada</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={salvarStatus}
                    disabled={alterandoStatus || statusNovo === selecionado.status_conta}
                    className="w-full h-9 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {alterandoStatus ? 'Salvando...' : 'Alterar estado'}
                  </button>
                </div>
                {erroStatus && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {erroStatus}
                  </p>
                )}
                {sucessoStatus && (
                  <p className="text-xs text-[#3cb478] bg-[#3cb478]/8 border border-[#3cb478]/20 rounded-xl px-3 py-2">
                    {sucessoStatus}
                  </p>
                )}
              </div>}
            </div>

            <div className="px-6 py-4 border-t border-black/8 flex justify-end">
              <button
                type="button"
                onClick={fecharModal}
                className="h-9 px-4 rounded-xl text-sm text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
