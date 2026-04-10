import { useState } from 'react'
import { Search, X, Shield, ShieldOff, Mail, UserCircle } from 'lucide-react'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
import api from '../../services/api'

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

export default function Usuarios() {
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
    api.get(`/admin/usuarios/buscar?${params}`)
      .then((res) => setUsuario(res.data))
      .catch((err) => {
        const status = err?.response?.status
        setErroBusca(
          status === 404
            ? 'Nenhum usuário encontrado.'
            : status === 422
            ? (err?.response?.data?.detail ?? 'Valor inválido.')
            : 'Erro ao buscar usuário.'
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

  const abrirModal = (u) => {
    setSelecionado(u)
    setEmailNovo(u.email)
    setErroEmail('')
    setSucessoEmail(false)
    setConfirmandoAdmin(false)
    setErroAdmin('')
    setSucessoAdmin('')
  }

  const fecharModal = () => {
    setSelecionado(null)
    setEmailNovo('')
    setErroEmail('')
    setSucessoEmail(false)
    setConfirmandoAdmin(false)
    setErroAdmin('')
    setSucessoAdmin('')
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
    api.patch(`/admin/usuarios/${selecionado.id_usuario}/email`, { email: emailNovo.trim() })
      .then(() => {
        const atualizado = { ...selecionado, email: emailNovo.trim() }
        setSelecionado(atualizado)
        setUsuario(atualizado)
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
    api.patch(`/admin/usuarios/${selecionado.id_usuario}/${acao}`)
      .then(() => {
        const atualizado = { ...selecionado, ja_e_admin: !selecionado.ja_e_admin }
        setSelecionado(atualizado)
        setUsuario(atualizado)
        setSucessoAdmin(promovendo_ ? 'Usuário promovido a administrador.' : 'Acesso de administrador revogado.')
      })
      .catch((err) => setErroAdmin(err?.response?.data?.detail ?? 'Erro ao alterar permissões.'))
      .finally(() => { setPromovendo(false); setConfirmandoAdmin(false) })
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#2a2a2a] tracking-tight">Usuários</h1>

      {/* Busca */}
      <form onSubmit={buscar} className="bg-white border border-black/8 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <input
            value={cpfBusca}
            onChange={(e) => setCpfBusca(e.target.value)}
            placeholder="CPF ou e-mail"
            className={inputCls}
          />
          {buscaRealizada && (
            <button
              type="button"
              onClick={limpar}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
          <button
            type="submit"
            disabled={carregando || !cpfBusca.trim()}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
            Buscar
          </button>
        </div>
      </form>

      {/* Resultado */}
      <div className="bg-white border border-black/8 rounded-2xl overflow-hidden">
        {!buscaRealizada ? (
          <p className="text-sm text-[#2a2a2a]/40 text-center py-16">
            Digite um CPF ou e-mail e clique em Buscar.
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
                <td className="px-4 py-3 text-right">
                  <button
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

      {/* Modal */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
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
                onClick={fecharModal}
                className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="px-6 py-5 space-y-5">
              {/* E-mail */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailNovo}
                    onChange={(e) => { setEmailNovo(e.target.value); setSucessoEmail(false); setErroEmail('') }}
                    className={inputCls}
                  />
                  <button
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

              {/* Permissões */}
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
                        onClick={() => { setConfirmandoAdmin(true); setErroAdmin(''); setSucessoAdmin('') }}
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
                          onClick={() => setConfirmandoAdmin(false)}
                          disabled={promovendo}
                          className="h-7 px-3 rounded-lg text-xs text-[#2a2a2a]/50 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/8 transition-colors disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={toggleAdmin}
                          disabled={promovendo}
                          className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                            selecionado.ja_e_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3cb478] hover:bg-[#349d69]'
                          }`}
                        >
                          {promovendo && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
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
            </div>

            {/* Rodapé */}
            <div className="px-6 py-4 border-t border-black/8 flex justify-end">
              <button
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
