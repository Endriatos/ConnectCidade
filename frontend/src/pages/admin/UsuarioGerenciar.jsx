import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleUser,
  Loader2,
  Mail,
  Shield,
  ShieldOff,
  X,
} from 'lucide-react'
import api from '../../services/api'
import ModalGerenciarSolicitacao from '../../components/admin/ModalGerenciarSolicitacao'
import AdminUserSummaryCard from '../../components/admin/AdminUserSummaryCard'
import AdminSolicitacoesTable from '../../components/admin/AdminSolicitacoesTable'
import StatusContaBadge from '../../components/admin/StatusContaBadge'
import InlineNotice from '../../components/common/InlineNotice'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputCls =
  'h-9 px-3 rounded-xl border border-black/12 text-sm text-[#2a2a2a] bg-white focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60 placeholder:text-[#2a2a2a]/30 w-full'

const STATUS_CONTA = {
  0: { label: 'Pendente', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  1: { label: 'Ativada', cls: 'border-[#3cb478]/40 bg-[#3cb478]/6 text-[#3cb478]' },
  2: { label: 'Bloqueada', cls: 'border-red-200 bg-red-50 text-red-600' },
}

export default function UsuarioGerenciar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const idNum = Number(id)

  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [categoriasPorId, setCategoriasPorId] = useState({})

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

  const [meuIdUsuario, setMeuIdUsuario] = useState(null)
  const [solModalPreview, setSolModalPreview] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then((res) => setMeuIdUsuario(res.data.id_usuario)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const carregar = useCallback(() => {
    if (!Number.isInteger(idNum) || idNum < 1) {
      setErro('Identificador inválido.')
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    api
      .get(`/admin/usuarios/${idNum}`)
      .then((res) => {
        setUsuario(res.data)
        setEmailNovo(res.data.email)
        setStatusNovo(res.data.status_conta ?? 1)
      })
      .catch((err) => {
        setErro(
          err?.response?.status === 404
            ? 'Usuário não encontrado.'
            : 'Não foi possível carregar o usuário.',
        )
        setUsuario(null)
      })
      .finally(() => setCarregando(false))
  }, [idNum])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    api
      .get('/categorias')
      .then((res) => {
        setCategoriasPorId(Object.fromEntries(res.data.map((c) => [c.id_categoria, c])))
      })
      .catch(() => {})
  }, [])

  const proprioUsuario =
    usuario != null && meuIdUsuario !== null && usuario.id_usuario === meuIdUsuario
  const bloquearAlternarPermissaoAdmin = proprioUsuario && usuario?.ja_e_admin

  const salvarEmail = () => {
    if (!usuario || !emailNovo.trim() || emailNovo === usuario.email) return
    if (!REGEX_EMAIL.test(emailNovo.trim())) {
      setErroEmail('Digite um e-mail válido.')
      return
    }
    setSalvandoEmail(true)
    setErroEmail('')
    setSucessoEmail(false)
    api
      .patch(`/admin/usuarios/${usuario.id_usuario}/email`, { email: emailNovo.trim() })
      .then(() => {
        setUsuario((u) => (u ? { ...u, email: emailNovo.trim() } : u))
        setSucessoEmail(true)
      })
      .catch((err) => setErroEmail(err?.response?.data?.detail ?? 'Erro ao salvar e-mail.'))
      .finally(() => setSalvandoEmail(false))
  }

  const toggleAdmin = () => {
    if (!usuario) return
    const promovendo_ = !usuario.ja_e_admin
    const acao = usuario.ja_e_admin ? 'revogar' : 'promover'
    setPromovendo(true)
    setErroAdmin('')
    setSucessoAdmin('')
    api
      .patch(`/admin/usuarios/${usuario.id_usuario}/${acao}`)
      .then(() => {
        setUsuario((u) => (u ? { ...u, ja_e_admin: !u.ja_e_admin } : u))
        setSucessoAdmin(
          promovendo_
            ? 'Usuário promovido a administrador.'
            : 'Acesso de administrador revogado.',
        )
      })
      .catch((err) => setErroAdmin(err?.response?.data?.detail ?? 'Erro ao alterar permissões.'))
      .finally(() => {
        setPromovendo(false)
        setConfirmandoAdmin(false)
      })
  }

  const salvarStatus = () => {
    if (!usuario || statusNovo === usuario.status_conta) return
    setAlterandoStatus(true)
    setErroStatus('')
    setSucessoStatus('')
    api
      .patch(`/admin/usuarios/${usuario.id_usuario}/status-conta`, { status_conta: statusNovo })
      .then(() => {
        setUsuario((u) => (u ? { ...u, status_conta: statusNovo } : u))
        setSucessoStatus(`Estado alterado para ${STATUS_CONTA[statusNovo].label}.`)
      })
      .catch((err) => setErroStatus(err?.response?.data?.detail ?? 'Erro ao alterar estado.'))
      .finally(() => setAlterandoStatus(false))
  }

  if (!Number.isInteger(idNum) || idNum < 1) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
        <p className="text-sm text-[#2a2a2a]/60">Identificador inválido.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/usuarios')}
          className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#2a2a2a]/55 transition-colors hover:text-[#2a2a2a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista de usuários
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2a2a2a]">Gerenciar usuário</h1>
          <p className="mt-0.5 text-sm text-[#2a2a2a]/50">
            Dados da conta, permissões e solicitações registradas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/usuarios')}
          className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#2a2a2a]/55 transition-colors hover:text-[#2a2a2a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista de usuários
        </button>

        <div className="space-y-6">
          {carregando && (
            <div className="py-10">
              <div className="flex flex-col items-center gap-4 rounded-xl border border-black/6 bg-white px-8 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#3cb478]" />
                <p className="text-sm text-[#2a2a2a]/50">Carregando…</p>
              </div>
            </div>
          )}

          {!carregando && erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center shadow-sm">
              <p className="text-sm text-red-800">{erro}</p>
              <button
                type="button"
                onClick={() => void carregar()}
                className="mt-4 rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#349d69] transition-colors"
              >
                Tentar novamente
              </button>
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/usuarios')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#3cb478] hover:text-[#349d69]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a lista de usuários
                </button>
              </div>
            </div>
          )}

          {!carregando && usuario && (
            <div className="space-y-6">
              <AdminUserSummaryCard usuario={usuario} />

            <div className="rounded-xl border border-black/6 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
              <div>
                <h2 className="text-lg font-semibold text-[#2a2a2a]">Conta e permissões</h2>
                <p className="mt-1 text-sm text-[#2a2a2a]/45">
                  E-mail de acesso, perfil de administrador e estado da conta.
                </p>
              </div>
              <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
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
                    disabled={salvandoEmail || !emailNovo.trim() || emailNovo === usuario.email}
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

              {proprioUsuario && (
                <InlineNotice>
                  Você é o titular desta conta. Por política de gestão, outro administrador deve atualizar permissões e
                  estado da conta.
                </InlineNotice>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Permissões
                </p>
                <div className="rounded-xl border border-black/8 px-4 py-3 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2a2a2a]">
                        {usuario.ja_e_admin ? 'Administrador' : 'Cidadão'}
                      </p>
                      <p className="text-xs text-[#2a2a2a]/40 mt-0.5">
                        {usuario.ja_e_admin
                          ? 'Acesso total ao painel administrativo'
                          : 'Acesso apenas às funcionalidades de cidadão'}
                      </p>
                    </div>
                    {!confirmandoAdmin && !bloquearAlternarPermissaoAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmandoAdmin(true)
                          setErroAdmin('')
                          setSucessoAdmin('')
                        }}
                        className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium border transition-colors shrink-0 sm:ml-4 ${
                          usuario.ja_e_admin
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8'
                        }`}
                      >
                        {usuario.ja_e_admin ? (
                          <ShieldOff className="h-3.5 w-3.5" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                        {usuario.ja_e_admin ? 'Revogar' : 'Promover'}
                      </button>
                    )}
                  </div>
                  {confirmandoAdmin && !bloquearAlternarPermissaoAdmin && (
                    <div className="flex flex-col gap-3 rounded-lg bg-[#2a2a2a]/4 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[#2a2a2a]/70">
                        {usuario.ja_e_admin ? 'Revogar acesso de administrador?' : 'Promover a administrador?'}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
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
                            usuario.ja_e_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3cb478] hover:bg-[#349d69]'
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

              {!usuario.is_master && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#2a2a2a]/50 flex items-center gap-1.5">
                    <CircleUser className="h-3.5 w-3.5" />
                    Estado da conta
                  </p>
                  {proprioUsuario ? (
                    <div className="rounded-xl border border-black/8 px-4 py-3">
                      <StatusContaBadge status={usuario.status_conta} />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-black/8 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#2a2a2a]">
                              {STATUS_CONTA[usuario.status_conta]?.label ?? 'Pendente'}
                            </p>
                            <p className="text-xs text-[#2a2a2a]/40 mt-0.5">Estado atual da conta</p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <select
                              value={statusNovo}
                              onChange={(e) => {
                                setStatusNovo(Number(e.target.value))
                                setSucessoStatus('')
                                setErroStatus('')
                              }}
                              className="h-8 px-3 rounded-lg border border-black/12 bg-white text-xs text-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#3cb478]/30 focus:border-[#3cb478]/60"
                            >
                              <option value={0}>Pendente</option>
                              <option value={1}>Ativada</option>
                              <option value={2}>Bloqueada</option>
                            </select>
                            <button
                              type="button"
                              onClick={salvarStatus}
                              disabled={alterandoStatus || statusNovo === usuario.status_conta}
                              className="h-8 px-3 rounded-lg bg-[#3cb478] text-white text-xs font-medium hover:bg-[#349d69] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                            >
                              {alterandoStatus ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
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
                    </>
                  )}
                </div>
              )}
              </div>
            </div>

            {((usuario.solicitacoes?.length ?? 0) > 0 || !usuario.ja_e_admin) && (
              <div className="overflow-hidden rounded-xl border border-black/6 bg-white shadow-sm">
                <div className="border-b border-black/6 px-5 py-5 sm:px-6 sm:py-6">
                  <h2 className="text-lg font-semibold text-[#2a2a2a]">Solicitações deste usuário</h2>
                  <p className="mt-1 text-sm text-[#2a2a2a]/45">
                    Histórico de solicitações abertas por este cidadão.
                  </p>
                </div>
                {(usuario.solicitacoes?.length ?? 0) > 0 ? (
                  <AdminSolicitacoesTable
                    itens={usuario.solicitacoes}
                    categoriasPorId={categoriasPorId}
                    onRowClick={(item) => setSolModalPreview(item)}
                    onGerenciarClick={(item) => setSolModalPreview(item)}
                  />
                ) : (
                  <p className="text-sm text-[#2a2a2a]/40 text-center py-16">Nenhuma solicitação registrada.</p>
                )}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {solModalPreview && (
        <ModalGerenciarSolicitacao
          preview={solModalPreview}
          categorias={Object.values(categoriasPorId)}
          meuIdUsuario={meuIdUsuario}
          onClose={() => setSolModalPreview(null)}
          onSucessoStatus={(nova) => {
            setUsuario((u) => {
              if (!u) return u
              const nomeCat = categoriasPorId[nova.id_categoria]?.nome_categoria
              return {
                ...u,
                solicitacoes: u.solicitacoes.map((so) =>
                  so.id_solicitacao === nova.id_solicitacao
                    ? {
                        ...so,
                        id_categoria: nova.id_categoria,
                        protocolo: nova.protocolo,
                        nome_categoria: nomeCat ?? so.nome_categoria,
                        descricao: nova.descricao,
                        endereco_referencia: nova.endereco_referencia,
                        contador_apoios: nova.contador_apoios,
                        status: nova.status,
                        data_registro: nova.data_registro,
                      }
                    : so
                ),
              }
            })
            setToast({ tipo: 'sucesso', mensagem: 'Status atualizado com sucesso.' })
          }}
          onFeedbackErro={(detalhe) => setToast({ tipo: 'erro', mensagem: detalhe })}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-60 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up ${
            toast.tipo === 'sucesso' ? 'bg-[#2a2a2a] text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.tipo === 'sucesso' ? (
            <svg className="h-4 w-4 shrink-0 text-[#3cb478]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.mensagem}
        </div>
      )}
    </>
  )
}
