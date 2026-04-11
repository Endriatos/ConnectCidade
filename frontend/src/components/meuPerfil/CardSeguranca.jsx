import { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import api from '../../services/api'
import {
  avaliarForca,
  classeInput,
  infoForca,
  mensagemErroApi,
  validarCampoSenha,
} from '../../utils/meuPerfilForm'

export default function CardSeguranca() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirmar, setSenhaConfirmar] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarSenhaNova, setMostrarSenhaNova] = useState(false)
  const [mostrarSenhaConfirmar, setMostrarSenhaConfirmar] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState(null)
  const [errosSenha, setErrosSenha] = useState({
    senha_atual: '',
    senha_nova: '',
    confirmar_senha: '',
  })
  const [erroGeralSenha, setErroGeralSenha] = useState('')

  const setErroSenhaCampo = (field, msg) =>
    setErrosSenha((prev) => ({ ...prev, [field]: msg }))

  const clearErroSenhaCampo = (field) =>
    setErrosSenha((prev) => ({ ...prev, [field]: '' }))

  const blurSenha = (field) => {
    const msg = validarCampoSenha(field, senhaAtual, senhaNova, senhaConfirmar)
    setErroSenhaCampo(field, msg)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErroGeralSenha('')
    setMsgSenha(null)
    const novos = {
      senha_atual: validarCampoSenha('senha_atual', senhaAtual, senhaNova, senhaConfirmar),
      senha_nova: validarCampoSenha('senha_nova', senhaAtual, senhaNova, senhaConfirmar),
      confirmar_senha: validarCampoSenha('confirmar_senha', senhaAtual, senhaNova, senhaConfirmar),
    }
    setErrosSenha(novos)
    if (Object.values(novos).some(Boolean)) return

    setSalvandoSenha(true)
    try {
      await api.patch('/usuarios/me/senha', {
        senha_atual: senhaAtual,
        senha_nova: senhaNova,
      })
      setSenhaAtual('')
      setSenhaNova('')
      setSenhaConfirmar('')
      setErrosSenha({ senha_atual: '', senha_nova: '', confirmar_senha: '' })
      setMsgSenha('Senha alterada com sucesso.')
    } catch (err) {
      setErroGeralSenha(mensagemErroApi(err))
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void salvar(e)}
      className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#2a2a2a]/45" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#2a2a2a]">Segurança</h2>
          <p className="mt-1 text-sm font-medium text-[#2a2a2a]/70">Alterar senha de acesso.</p>
          <p className="mt-1 text-sm text-[#2a2a2a]/55">
            Informe a senha atual e escolha uma nova. Prefira uma combinação forte e exclusiva para esta conta.
          </p>
        </div>
      </div>

      <div className="mt-6 w-full max-w-md sm:max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Senha atual</label>
            <div className="relative">
              <input
                type={mostrarSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => {
                  setSenhaAtual(e.target.value)
                  clearErroSenhaCampo('senha_atual')
                  setErroGeralSenha('')
                  setMsgSenha(null)
                }}
                onBlur={() => blurSenha('senha_atual')}
                placeholder="••••••••"
                className={classeInput(errosSenha.senha_atual) + ' pr-12'}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 transition-colors hover:text-[#2a2a2a]/60"
              >
                {mostrarSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errosSenha.senha_atual && (
              <p className="mt-0.5 text-xs text-red-500">{errosSenha.senha_atual}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
            <div className="min-w-0 flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenhaNova ? 'text' : 'password'}
                  value={senhaNova}
                  onChange={(e) => {
                    setSenhaNova(e.target.value)
                    clearErroSenhaCampo('senha_nova')
                    clearErroSenhaCampo('confirmar_senha')
                    setErroGeralSenha('')
                    setMsgSenha(null)
                  }}
                  onBlur={() => blurSenha('senha_nova')}
                  placeholder="••••••••"
                  className={classeInput(errosSenha.senha_nova) + ' pr-12'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaNova((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 transition-colors hover:text-[#2a2a2a]/60"
                >
                  {mostrarSenhaNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {senhaNova.length > 0 && (() => {
                const pontos = avaliarForca(senhaNova)
                const { label, cor, largura } = infoForca(pontos)
                const corTexto =
                  pontos <= 2 ? 'text-red-500' : pontos <= 4 ? 'text-amber-600' : 'text-[#2a7a4a]'
                return (
                  <div className="mt-1.5">
                    <div className="h-1.5 w-full rounded-full bg-[#2a2a2a]/10">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${cor} ${largura}`} />
                    </div>
                    <p className={`mt-0.5 text-xs ${corTexto}`}>{label}</p>
                  </div>
                )
              })()}
              {errosSenha.senha_nova && (
                <p className="mt-0.5 text-xs text-red-500">{errosSenha.senha_nova}</p>
              )}
            </div>

            <div className="min-w-0 flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Confirmar senha</label>
              <div className="relative">
                <input
                  type={mostrarSenhaConfirmar ? 'text' : 'password'}
                  value={senhaConfirmar}
                  onChange={(e) => {
                    setSenhaConfirmar(e.target.value)
                    clearErroSenhaCampo('confirmar_senha')
                    setErroGeralSenha('')
                    setMsgSenha(null)
                  }}
                  onBlur={() => blurSenha('confirmar_senha')}
                  placeholder="••••••••"
                  className={classeInput(errosSenha.confirmar_senha) + ' pr-12'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaConfirmar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 transition-colors hover:text-[#2a2a2a]/60"
                >
                  {mostrarSenhaConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errosSenha.confirmar_senha && (
                <p className="mt-0.5 text-xs text-red-500">{errosSenha.confirmar_senha}</p>
              )}
            </div>
          </div>
        </div>

        {erroGeralSenha && (
          <p className="mt-4 text-center text-sm text-red-500">{erroGeralSenha}</p>
        )}
        {msgSenha && (
          <p className="mt-4 rounded-xl bg-[#3cb478]/10 px-4 py-2 text-sm font-medium text-[#2a7a4a]">{msgSenha}</p>
        )}

        <button
          type="submit"
          disabled={salvandoSenha}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2a2a]/12 bg-white py-2.5 text-sm font-medium text-[#2a2a2a] transition-colors hover:bg-[#2a2a2a]/5 disabled:pointer-events-none disabled:opacity-45 sm:w-auto sm:px-6"
        >
          {salvandoSenha && <Loader2 className="h-4 w-4 animate-spin" />}
          Atualizar senha
        </button>
      </div>
    </form>
  )
}
