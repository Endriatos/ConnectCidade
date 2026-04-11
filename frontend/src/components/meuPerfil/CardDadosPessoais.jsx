import { useEffect, useMemo, useState } from 'react'
import { Info, Loader2, Pencil } from 'lucide-react'
import api from '../../services/api'
import {
  classeInput,
  dataIsoParaInput,
  formatCPF,
  formatTelefone,
  formatarDataNascimentoExibicao,
  mensagemErroApi,
  validarCampoDados,
} from '../../utils/meuPerfilForm'

export default function CardDadosPessoais({ servidor, onServidorAtualizado }) {
  const [edicaoDados, setEdicaoDados] = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [errosDados, setErrosDados] = useState({
    nome_usuario: '',
    telefone: '',
    data_nascimento: '',
  })
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [msgDados, setMsgDados] = useState(null)
  const [erroApiDados, setErroApiDados] = useState('')

  useEffect(() => {
    if (!servidor || edicaoDados) return
    setNomeUsuario(servidor.nome_usuario || '')
    setTelefone(formatTelefone(servidor.telefone || ''))
    setDataNascimento(dataIsoParaInput(servidor.data_nascimento))
  }, [servidor, edicaoDados])

  const dadosAlterados = useMemo(() => {
    if (!servidor) return false
    const telServ = (servidor.telefone || '').replace(/\D/g, '')
    const telForm = telefone.replace(/\D/g, '')
    return (
      nomeUsuario.trim() !== (servidor.nome_usuario || '').trim() ||
      telForm !== telServ ||
      dataNascimento !== dataIsoParaInput(servidor.data_nascimento)
    )
  }, [servidor, nomeUsuario, telefone, dataNascimento])

  const setErroDado = (field, msg) =>
    setErrosDados((prev) => ({ ...prev, [field]: msg }))

  const clearErroDado = (field) =>
    setErrosDados((prev) => ({ ...prev, [field]: '' }))

  const blurDado = (field) => {
    const msg = validarCampoDados(field, nomeUsuario, telefone, dataNascimento)
    setErroDado(field, msg)
  }

  const iniciarEdicao = () => {
    if (!servidor) return
    setNomeUsuario(servidor.nome_usuario || '')
    setTelefone(formatTelefone(servidor.telefone || ''))
    setDataNascimento(dataIsoParaInput(servidor.data_nascimento))
    setErrosDados({ nome_usuario: '', telefone: '', data_nascimento: '' })
    setErroApiDados('')
    setMsgDados(null)
    setEdicaoDados(true)
  }

  const cancelarEdicao = () => {
    if (!servidor) return
    setNomeUsuario(servidor.nome_usuario || '')
    setTelefone(formatTelefone(servidor.telefone || ''))
    setDataNascimento(dataIsoParaInput(servidor.data_nascimento))
    setErrosDados({ nome_usuario: '', telefone: '', data_nascimento: '' })
    setErroApiDados('')
    setEdicaoDados(false)
  }

  const salvar = async (e) => {
    e.preventDefault()
    if (!servidor || !dadosAlterados) return
    setErroApiDados('')
    setMsgDados(null)
    const novos = {
      nome_usuario: validarCampoDados('nome_usuario', nomeUsuario, telefone, dataNascimento),
      telefone: validarCampoDados('telefone', nomeUsuario, telefone, dataNascimento),
      data_nascimento: validarCampoDados('data_nascimento', nomeUsuario, telefone, dataNascimento),
    }
    setErrosDados(novos)
    if (Object.values(novos).some(Boolean)) return

    const nomeTrim = nomeUsuario.trim()
    setSalvandoDados(true)
    try {
      const body = {}
      if (nomeTrim !== servidor.nome_usuario) body.nome_usuario = nomeTrim
      const telDigits = telefone.replace(/\D/g, '')
      const telServ = (servidor.telefone || '').replace(/\D/g, '')
      if (telDigits !== telServ) body.telefone = telDigits.length ? telDigits : ''
      const dn = dataNascimento
      const dnServ = dataIsoParaInput(servidor.data_nascimento)
      if (dn && dn !== dnServ) body.data_nascimento = dn
      if (Object.keys(body).length === 0) {
        setSalvandoDados(false)
        return
      }
      const { data } = await api.patch('/usuarios/me', body)
      onServidorAtualizado(data)
      setMsgDados('Dados salvos com sucesso.')
      setEdicaoDados(false)
    } catch (err) {
      setErroApiDados(mensagemErroApi(err))
    } finally {
      setSalvandoDados(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#2a2a2a]">Dados pessoais</h2>
          <p className="mt-1 text-sm text-[#2a2a2a]/45">Informações exibidas nas solicitações e no sistema.</p>
        </div>
        {!edicaoDados && (
          <button
            type="button"
            onClick={iniciarEdicao}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#2a2a2a]/10 p-2.5 text-[#2a2a2a]/55 transition-colors hover:border-[#3cb478]/40 hover:bg-[#3cb478]/8 hover:text-[#3cb478]"
            aria-label="Editar dados pessoais"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {!edicaoDados && (
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">Nome completo</dt>
            <dd className="mt-1 text-sm font-medium text-[#2a2a2a]">{servidor.nome_usuario}</dd>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">CPF</dt>
              <dd className="mt-1 text-sm font-medium text-[#2a2a2a]">{formatCPF(servidor.cpf)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">E-mail</dt>
              <dd className="mt-1 text-sm font-medium text-[#2a2a2a] break-all">{servidor.email}</dd>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">Celular</dt>
              <dd className="mt-1 text-sm font-medium text-[#2a2a2a]">
                {servidor.telefone ? formatTelefone(servidor.telefone) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">Data de nascimento</dt>
              <dd className="mt-1 text-sm font-medium text-[#2a2a2a]">
                {formatarDataNascimentoExibicao(servidor.data_nascimento)}
              </dd>
            </div>
          </div>
        </dl>
      )}

      {edicaoDados && (
        <form onSubmit={(e) => void salvar(e)} className="mt-6 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Nome completo</label>
            <input
              type="text"
              value={nomeUsuario}
              onChange={(e) => {
                setNomeUsuario(e.target.value)
                setMsgDados(null)
                setErroApiDados('')
                clearErroDado('nome_usuario')
              }}
              onBlur={() => blurDado('nome_usuario')}
              placeholder="Seu nome completo"
              className={classeInput(errosDados.nome_usuario)}
              autoComplete="name"
            />
            {errosDados.nome_usuario && (
              <p className="mt-0.5 text-xs text-red-500">{errosDados.nome_usuario}</p>
            )}
          </div>
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-[#2a2a2a]/55">
              CPF e e-mail não podem ser alterados por aqui. Em caso de dúvida sobre seus dados, use os canais de contato da plataforma.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">CPF</label>
              <input
                type="text"
                readOnly
                value={formatCPF(servidor.cpf)}
                className="w-full cursor-not-allowed rounded-xl border border-[#2a2a2a]/10 bg-[#f5f5f5] px-4 py-3 text-sm text-[#2a2a2a]/55"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">E-mail</label>
              <input
                type="text"
                readOnly
                value={servidor.email}
                className="w-full cursor-not-allowed rounded-xl border border-[#2a2a2a]/10 bg-[#f5f5f5] px-4 py-3 text-sm text-[#2a2a2a]/55"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">
                Celular <span className="normal-case text-[#2a2a2a]/30 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => {
                  setTelefone(formatTelefone(e.target.value))
                  setMsgDados(null)
                  setErroApiDados('')
                  clearErroDado('telefone')
                }}
                onBlur={() => blurDado('telefone')}
                placeholder="(00) 99999-9999"
                className={classeInput(errosDados.telefone)}
                autoComplete="tel"
              />
              {errosDados.telefone && <p className="mt-0.5 text-xs text-red-500">{errosDados.telefone}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Data de nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => {
                  setDataNascimento(e.target.value)
                  setMsgDados(null)
                  setErroApiDados('')
                  clearErroDado('data_nascimento')
                }}
                onBlur={() => blurDado('data_nascimento')}
                className={classeInput(errosDados.data_nascimento)}
              />
              {errosDados.data_nascimento && (
                <p className="mt-0.5 text-xs text-red-500">{errosDados.data_nascimento}</p>
              )}
            </div>
          </div>

          {erroApiDados && (
            <p className="text-sm text-red-500" role="alert">
              {erroApiDados}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!dadosAlterados || salvandoDados}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3cb478] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#349d69] disabled:pointer-events-none disabled:opacity-45"
            >
              {salvandoDados && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </button>
            <button
              type="button"
              onClick={cancelarEdicao}
              disabled={salvandoDados}
              className="rounded-xl border border-[#2a2a2a]/12 bg-white px-5 py-2.5 text-sm font-medium text-[#2a2a2a] transition-colors hover:bg-[#2a2a2a]/5 disabled:pointer-events-none disabled:opacity-45"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {msgDados && !edicaoDados && (
        <p className="mt-6 rounded-xl bg-[#3cb478]/10 px-4 py-2 text-sm font-medium text-[#2a7a4a]">{msgDados}</p>
      )}
    </div>
  )
}
