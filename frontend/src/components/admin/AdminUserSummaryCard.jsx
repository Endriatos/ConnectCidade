import { Shield, User } from 'lucide-react'
import StatusContaBadge from './StatusContaBadge'

function formatarCPF(cpf) {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatarDataCadastro(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function iniciais(nome) {
  if (!nome?.trim()) return '?'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export default function AdminUserSummaryCard({ usuario }) {
  return (
    <div className="rounded-xl border border-black/6 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl font-semibold text-indigo-900">
          {iniciais(usuario.nome_usuario)}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-[#2a2a2a]">{usuario.nome_usuario}</p>
          <p className="mt-1 font-mono text-xs text-[#2a2a2a]/45">{formatarCPF(usuario.cpf)}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {usuario.ja_e_admin ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#3cb478]/35 bg-[#3cb478]/10 px-3 py-1 text-xs font-medium text-[#2a7a4a]">
                <Shield className="h-3.5 w-3.5" />
                Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a]/10 bg-[#2a2a2a]/5 px-3 py-1 text-xs font-medium text-[#2a2a2a]/70">
                <User className="h-3.5 w-3.5" />
                Cidadão
              </span>
            )}
            <StatusContaBadge status={usuario.status_conta} />
          </div>
          <p className="mt-4 text-xs text-[#2a2a2a]/40">
            Membro desde {formatarDataCadastro(usuario.data_cadastro)}
          </p>
        </div>
      </div>
    </div>
  )
}
