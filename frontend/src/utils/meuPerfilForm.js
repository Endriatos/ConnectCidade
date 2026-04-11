export function formatCPF(value) {
  const n = (value || '').replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

export function formatTelefone(value) {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (!n) return ''
  if (n.length <= 2) return `(${n}`
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function dataIsoParaInput(iso) {
  if (!iso) return ''
  const s = typeof iso === 'string' ? iso.slice(0, 10) : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

export function formatarDataNascimentoExibicao(iso) {
  const s = dataIsoParaInput(iso)
  if (!s) return '—'
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
}

export function avaliarForca(senha) {
  if (!senha) return 0
  let p = 0
  if (senha.length >= 8) p++
  if (/[A-Z]/.test(senha)) p++
  if (/[a-z]/.test(senha)) p++
  if (/[0-9]/.test(senha)) p++
  if (/[^A-Za-z0-9]/.test(senha)) p++
  return p
}

export function infoForca(pontos) {
  if (pontos <= 2) return { label: 'Fraca', cor: 'bg-red-400', largura: 'w-1/3' }
  if (pontos <= 4) return { label: 'Média', cor: 'bg-yellow-400', largura: 'w-2/3' }
  return { label: 'Forte', cor: 'bg-[#3cb478]', largura: 'w-full' }
}

export function classeInput(erro) {
  return `w-full px-4 py-3 rounded-xl border text-[#2a2a2a] placeholder-[#2a2a2a]/25 text-sm focus:outline-none transition-colors ${
    erro ? 'border-red-400 focus:border-red-400' : 'border-[#2a2a2a]/10 focus:border-[#3cb478]'
  }`
}

export function mensagemErroApi(err) {
  const d = err.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0]?.msg) return d.map((x) => x.msg).join(' ')
  return 'Algo deu errado. Tente novamente.'
}

export function validarCampoDados(field, nomeUsuario, telefone, dataNascimento) {
  switch (field) {
    case 'nome_usuario': {
      const v = nomeUsuario.trim()
      if (!v) return 'Nome é obrigatório.'
      if (v.split(/\s+/).length < 2) return 'Informe o nome completo.'
      return ''
    }
    case 'telefone': {
      const d = telefone.replace(/\D/g, '')
      if (d && (d.length < 10 || d.length > 11)) return 'Celular inválido.'
      return ''
    }
    case 'data_nascimento': {
      const v = dataNascimento
      if (!v) return 'Data de nascimento é obrigatória.'
      const nascimento = new Date(v)
      const hoje = new Date()
      if (nascimento >= hoje) return 'Data deve ser no passado.'
      const idade = hoje.getFullYear() - nascimento.getFullYear()
      if (idade > 120) return 'Data inválida.'
      return ''
    }
    default:
      return ''
  }
}

export function validarCampoSenha(field, senhaAtual, senhaNova, senhaConfirmar) {
  switch (field) {
    case 'senha_atual':
      if (!senhaAtual) return 'Informe a senha atual.'
      return ''
    case 'senha_nova':
      if (!senhaNova) return 'Senha é obrigatória.'
      if (senhaNova.length < 8) return 'Mínimo de 8 caracteres.'
      if (!/[A-Z]/.test(senhaNova)) return 'Inclua pelo menos uma letra maiúscula.'
      if (!/[a-z]/.test(senhaNova)) return 'Inclua pelo menos uma letra minúscula.'
      if (!/[0-9]/.test(senhaNova)) return 'Inclua pelo menos um número.'
      if (!/[^A-Za-z0-9]/.test(senhaNova)) return 'Inclua pelo menos um caractere especial (!@#$%...).'
      return ''
    case 'confirmar_senha':
      if (!senhaConfirmar) return 'Confirme sua senha.'
      if (senhaConfirmar !== senhaNova) return 'As senhas não coincidem.'
      return ''
    default:
      return ''
  }
}
