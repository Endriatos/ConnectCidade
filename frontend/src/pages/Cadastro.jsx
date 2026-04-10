import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'
import iconCC from '../assets/iconCC.png'

// Formata o CPF digitado para o padrão 000.000.000-00
function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Valida o CPF pelos dígitos verificadores (mesmo algoritmo do backend)
function validarCPF(cpf) {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11) return false
  if (/^(\d)\1{10}$/.test(n)) return false // rejeita sequências iguais (ex: 111.111.111-11)
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i)
  const d1 = (soma * 10 % 11) % 10
  if (d1 !== parseInt(n[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i)
  const d2 = (soma * 10 % 11) % 10
  return d2 === parseInt(n[10])
}

// Formata o telefone digitado para o padrão (00) 00000-0000
function formatTelefone(value) {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (!n) return ''
  if (n.length <= 2) return `(${n}`
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

// Avalia a força da senha (0 = vazia, 1-2 = fraca, 3 = média, 4-5 = forte)
function avaliarForca(senha) {
  if (!senha) return 0
  let pontos = 0
  if (senha.length >= 8) pontos++
  if (/[A-Z]/.test(senha)) pontos++
  if (/[a-z]/.test(senha)) pontos++
  if (/[0-9]/.test(senha)) pontos++
  if (/[^A-Za-z0-9]/.test(senha)) pontos++
  return pontos
}

// Retorna rótulo e cor da barra de força da senha
function infoForca(pontos) {
  if (pontos <= 2) return { label: 'Fraca', cor: 'bg-red-400', largura: 'w-1/3' }
  if (pontos <= 4) return { label: 'Média', cor: 'bg-yellow-400', largura: 'w-2/3' }
  return { label: 'Forte', cor: 'bg-[#3cb478]', largura: 'w-full' }
}

// Retorna a classe CSS do input, aplicando borda vermelha se houver erro
function classeInput(erro) {
  return `w-full px-4 py-3 rounded-xl border text-[#2a2a2a] placeholder-[#2a2a2a]/25 text-sm focus:outline-none transition-colors ${
    erro ? 'border-red-400 focus:border-red-400' : 'border-[#2a2a2a]/10 focus:border-[#3cb478]'
  }`
}

// Modal com a Política de Privacidade completa
function ModalPrivacidade({ onAceitar, onFechar }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#2a2a2a]/8 shrink-0">
          <h2 className="text-lg font-semibold text-[#2a2a2a]">Política de Privacidade</h2>
          <button
            onClick={onFechar}
            className="text-[#2a2a2a]/40 hover:text-[#2a2a2a]/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto px-7 py-6 flex-1 text-sm text-[#2a2a2a]/75 leading-relaxed space-y-5">

          <p className="text-xs text-[#2a2a2a]/40">Última atualização: março de 2026</p>

          {/* Aviso de contexto acadêmico */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-xs leading-relaxed text-justify">
            <strong>Plataforma em fase de testes — Trabalho de Conclusão de Curso (TCC).</strong>{' '}
            O ConnectCidade é um protótipo acadêmico desenvolvido como projeto de TCC e ainda não está
            em operação comercial. Ao final do período de validação, todos os dados pessoais coletados
            serão <strong>anonimizados ou excluídos permanentemente</strong>.
          </div>

          <p className="text-justify">
            A presente Política de Privacidade descreve como o <strong className="text-[#2a2a2a]">ConnectCidade</strong> coleta,
            utiliza, armazena e protege as informações pessoais de seus usuários durante a fase de testes,
            em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">1. Controladores de Dados</h3>
            <p className="text-justify">
              O ConnectCidade é desenvolvido e operado por <strong className="text-[#2a2a2a]">Daniel Andreas Netto Albrecht</strong>,{' '}
              <strong className="text-[#2a2a2a]">Deivid Castagna Carvalho Spada</strong> e{' '}
              <strong className="text-[#2a2a2a]">Kauane Dalla Corte</strong>, responsáveis pelo tratamento
              das informações pessoais coletadas na plataforma.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">2. Dados Coletados</h3>
            <p>Para criar e manter sua conta, coletamos as seguintes informações:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-[#2a2a2a]">Nome completo</strong> — para identificação do usuário na plataforma.</li>
              <li><strong className="text-[#2a2a2a]">CPF</strong> — para garantir unicidade do cadastro e autenticidade do cidadão.</li>
              <li><strong className="text-[#2a2a2a]">E-mail</strong> — para comunicação e recuperação de acesso.</li>
              <li><strong className="text-[#2a2a2a]">Data de nascimento</strong> — para verificação de maioridade e conformidade legal.</li>
              <li><strong className="text-[#2a2a2a]">Telefone celular</strong> (opcional) — para contato em caso de atualização de solicitações.</li>
            </ul>
            <p className="text-justify">
              Além dos dados cadastrais, registramos as <strong className="text-[#2a2a2a]">solicitações e reclamações</strong> enviadas
              pelo usuário à plataforma, incluindo descrições, categorias, localização (bairro/endereço) e
              arquivos anexados (fotos).
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">3. Finalidade do Tratamento</h3>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Criação e gerenciamento da conta do usuário;</li>
              <li>Autenticação e controle de acesso;</li>
              <li>Registro, acompanhamento e resolução de solicitações e reclamações urbanas;</li>
              <li>Comunicação sobre o andamento das solicitações realizadas;</li>
              <li>Melhoria contínua da plataforma e dos serviços oferecidos;</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">4. Base Legal</h3>
            <p className="text-justify">
              O tratamento dos dados pessoais é realizado com base no <strong className="text-[#2a2a2a]">consentimento explícito</strong> do
              titular (art. 7º, I da LGPD), na <strong className="text-[#2a2a2a]">execução do contrato</strong> (prestação dos serviços da
              plataforma) e no <strong className="text-[#2a2a2a]">legítimo interesse</strong> dos controladores para melhoria dos serviços e
              segurança da plataforma.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">5. Compartilhamento de Dados</h3>
            <p className="text-justify">
              O ConnectCidade <strong className="text-[#2a2a2a]">não vende nem comercializa</strong> dados pessoais de usuários a terceiros.
              Podemos compartilhar informações nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                Com <strong className="text-[#2a2a2a]">órgãos públicos municipais</strong> responsáveis pelo atendimento das
                solicitações, na medida necessária para a resolução dos problemas reportados;
              </li>
              <li>
                Com <strong className="text-[#2a2a2a]">prestadores de serviços técnicos</strong> (hospedagem, banco de dados)
                que atuam sob contrato e estão sujeitos a obrigações de confidencialidade;
              </li>
              <li>
                Quando <strong className="text-[#2a2a2a]">exigido por lei</strong> ou por determinação judicial.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">6. Armazenamento e Segurança</h3>
            <p className="text-justify">
              Os dados são armazenados em servidores seguros, com acesso restrito e controlado. Adotamos
              medidas técnicas e organizacionais adequadas para proteger as informações pessoais contra
              acesso não autorizado, alteração, divulgação ou destruição, incluindo criptografia de
              senhas e tokens de autenticação.
            </p>
            <p className="text-justify">
              Por se tratar de uma plataforma em fase de validação acadêmica, os dados serão mantidos
              apenas durante o período de testes do TCC. <strong className="text-[#2a2a2a]">Ao término da avaliação,
              todos os dados pessoais serão anonimizados ou excluídos permanentemente</strong>, sem qualquer
              uso posterior para fins comerciais.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">7. Direitos do Titular</h3>
            <p>Em conformidade com a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Confirmar a existência de tratamento de seus dados;</li>
              <li>Acessar os dados que temos sobre você;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor;</li>
              <li>Opor-se ao tratamento realizado em desconformidade com a lei.</li>
            </ul>
            <p className="text-justify">Para exercer esses direitos, entre em contato pelos canais indicados na seção abaixo.</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">8. Cookies e Dados de Navegação</h3>
            <p className="text-justify">
              A plataforma pode utilizar cookies de sessão para manter o usuário autenticado durante o uso.
              Não utilizamos cookies de rastreamento ou publicidade. Os dados de acesso (logs) podem
              ser registrados para fins de segurança e diagnóstico técnico.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">9. Alterações nesta Política</h3>
            <p className="text-justify">
              Esta Política de Privacidade pode ser atualizada a qualquer momento, sem aviso prévio
              aos usuários. A versão vigente estará sempre disponível nesta tela. O uso continuado
              da plataforma após qualquer alteração será interpretado como aceitação integral da
              política atualizada.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-[#2a2a2a]">10. Contato</h3>
            <p className="text-justify">
              Em caso de dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais,
              entre em contato com os responsáveis pela plataforma pelos e-mails abaixo:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                Daniel Andreas Netto Albrecht —{' '}
                <a href="mailto:danielalbrecht@acad.ftec.com.br" className="text-[#3cb478] hover:underline">
                  danielalbrecht@acad.ftec.com.br
                </a>
              </li>
              <li>
                Deivid Castagna Carvalho Spada —{' '}
                <a href="mailto:dspada@outlook.com.br" className="text-[#3cb478] hover:underline">
                  dspada@outlook.com.br
                </a>
              </li>
              <li>
                Kauane Dalla Corte —{' '}
                <a href="mailto:kauane.corte@acad.ftec.com.br" className="text-[#3cb478] hover:underline">
                  kauane.corte@acad.ftec.com.br
                </a>
              </li>
            </ul>
          </section>

        </div>

        {/* Rodapé com botão de aceite */}
        <div className="px-7 py-5 border-t border-[#2a2a2a]/8 shrink-0">
          <button
            onClick={onAceitar}
            className="w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
          >
            Li e aceito a Política de Privacidade
          </button>
        </div>

      </div>
    </div>
  )
}

export default function Cadastro() {
  const [form, setForm] = useState({
    nome_usuario: '',
    cpf: '',
    email: '',
    data_nascimento: '',
    telefone: '',
    senha: '',
    confirmar_senha: '',
  })
  const [erros, setErros] = useState({})
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [erroGeral, setErroGeral] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalPrivacidade, setModalPrivacidade] = useState(false)
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false)
  const { login, setNome, token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) navigate('/home', { replace: true })
  }, [token, navigate])

  // Define o erro de um campo específico
  const setErro = (field, msg) =>
    setErros(prev => ({ ...prev, [field]: msg }))

  // Limpa o erro de um campo específico
  const clearErro = (field) =>
    setErros(prev => ({ ...prev, [field]: '' }))

  // Atualiza o valor do campo e aplica formatação quando necessário
  const handleChange = (field, value) => {
    let v = value
    if (field === 'cpf') { v = formatCPF(value); clearErro('cpf') }
    if (field === 'telefone') { v = formatTelefone(value); clearErro('telefone') }
    if (['nome_usuario', 'email', 'data_nascimento', 'senha', 'confirmar_senha'].includes(field)) {
      clearErro(field)
    }
    setForm(prev => ({ ...prev, [field]: v }))
  }

  // Retorna a mensagem de erro para cada campo ou string vazia se válido
  const validarCampo = (field) => {
    const v = form[field]
    switch (field) {
      case 'nome_usuario':
        if (!v.trim()) return 'Nome é obrigatório.'
        if (v.trim().split(/\s+/).length < 2) return 'Informe o nome completo.'
        return ''
      case 'cpf': {
        const d = v.replace(/\D/g, '')
        if (!d) return 'CPF é obrigatório.'
        if (d.length < 11) return 'CPF incompleto.'
        if (!validarCPF(v)) return 'CPF inválido.'
        return ''
      }
      case 'email':
        if (!v.trim()) return 'E-mail é obrigatório.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido.'
        return ''
      case 'data_nascimento': {
        if (!v) return 'Data de nascimento é obrigatória.'
        const nascimento = new Date(v)
        const hoje = new Date()
        if (nascimento >= hoje) return 'Data deve ser no passado.'
        const idade = hoje.getFullYear() - nascimento.getFullYear()
        if (idade > 120) return 'Data inválida.'
        return ''
      }
      case 'telefone': {
        const d = v.replace(/\D/g, '')
        if (d && (d.length < 10 || d.length > 11)) return 'Celular inválido.'
        return ''
      }
      case 'senha':
        if (!v) return 'Senha é obrigatória.'
        if (v.length < 8) return 'Mínimo de 8 caracteres.'
        if (!/[A-Z]/.test(v)) return 'Inclua pelo menos uma letra maiúscula.'
        if (!/[a-z]/.test(v)) return 'Inclua pelo menos uma letra minúscula.'
        if (!/[0-9]/.test(v)) return 'Inclua pelo menos um número.'
        if (!/[^A-Za-z0-9]/.test(v)) return 'Inclua pelo menos um caractere especial (!@#$%...).'
        return ''
      case 'confirmar_senha':
        if (!v) return 'Confirme sua senha.'
        if (v !== form.senha) return 'As senhas não coincidem.'
        return ''
      default:
        return ''
    }
  }

  // Valida o campo ao perder o foco
  const handleBlur = (field) => {
    const msg = validarCampo(field)
    setErro(field, msg)
  }

  // Valida todos os campos, envia o cadastro e faz login automático em seguida
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErroGeral('')

    // Valida todos os campos antes de enviar
    const campos = ['nome_usuario', 'cpf', 'email', 'data_nascimento', 'telefone', 'senha', 'confirmar_senha']
    const novosErros = {}
    campos.forEach(f => { novosErros[f] = validarCampo(f) })
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    if (!privacidadeAceita) {
      setErros(prev => ({ ...prev, privacidade: 'Você precisa aceitar a Política de Privacidade.' }))
      return
    }

    setCarregando(true)
    try {
      // Cria a conta
      await api.post('/auth/cadastro', {
        nome_usuario: form.nome_usuario,
        cpf: form.cpf.replace(/\D/g, ''),
        email: form.email,
        data_nascimento: form.data_nascimento,
        telefone: form.telefone.replace(/\D/g, '') || undefined,
        senha: form.senha,
      })

      // Faz login automático após o cadastro
      const { data } = await api.post('/auth/login', {
        cpf: form.cpf.replace(/\D/g, ''),
        senha: form.senha,
      })
      login(data.access_token, data.tipo_usuario)

      // Busca o nome do usuário para exibir no header
      const me = await api.get('/auth/me')
      setNome(me.data.nome_usuario)

      navigate('/home', { state: { recemCadastrado: true } })
    } catch (err) {
      console.error('Erro cadastro:', err.response?.status, err.response?.data)
      // Trata erros de validação do FastAPI (array) e erros simples (string)
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setErroGeral(detail.map(d => d.msg).join(' '))
      } else if (typeof detail === 'string') {
        setErroGeral(detail)
      } else {
        setErroGeral(`Erro ao realizar cadastro. (${err.response?.status ?? 'sem resposta'})`)
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Modal da Política de Privacidade */}
      {modalPrivacidade && (
        <ModalPrivacidade
          onAceitar={() => {
            setPrivacidadeAceita(true)
            setErros(prev => ({ ...prev, privacidade: '' }))
            setModalPrivacidade(false)
          }}
          onFechar={() => setModalPrivacidade(false)}
        />
      )}

      {/* Header fixo no topo */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <div className="flex items-center gap-3 translate-y-px">
            <Link to="/login" className="text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors">
              Entrar
            </Link>
            <Link to="/cadastro" className="text-sm font-medium px-4 py-2 rounded-lg bg-[#3cb478] text-white hover:bg-[#349d69] transition-colors">
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

          {/* Ícone e título */}
          <div className="mb-8 text-center">
            <img src={iconCC} alt="Connect Cidade" className="h-14 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-[#2a2a2a] tracking-tight">Criar conta</p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">Preencha os dados para se cadastrar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nome completo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Nome completo</label>
              <input
                type="text"
                value={form.nome_usuario}
                onChange={e => handleChange('nome_usuario', e.target.value)}
                onBlur={() => handleBlur('nome_usuario')}
                placeholder="Seu nome completo"
                className={classeInput(erros.nome_usuario)}
              />
              {erros.nome_usuario && <p className="text-xs text-red-500 mt-0.5">{erros.nome_usuario}</p>}
            </div>

            {/* CPF */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={e => handleChange('cpf', e.target.value)}
                onBlur={() => handleBlur('cpf')}
                placeholder="000.000.000-00"
                className={classeInput(erros.cpf)}
              />
              {erros.cpf && <p className="text-xs text-red-500 mt-0.5">{erros.cpf}</p>}
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">E-mail</label>
              <input
                type="text"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="seu@email.com"
                className={classeInput(erros.email)}
              />
              {erros.email && <p className="text-xs text-red-500 mt-0.5">{erros.email}</p>}
            </div>

            {/* Data de nascimento */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={e => handleChange('data_nascimento', e.target.value)}
                onBlur={() => handleBlur('data_nascimento')}
                className={classeInput(erros.data_nascimento)}
              />
              {erros.data_nascimento && <p className="text-xs text-red-500 mt-0.5">{erros.data_nascimento}</p>}
            </div>

            {/* Celular (opcional) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">
                Celular <span className="normal-case text-[#2a2a2a]/30 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => handleChange('telefone', e.target.value)}
                onBlur={() => handleBlur('telefone')}
                placeholder="(00) 99999-9999"
                className={classeInput(erros.telefone)}
              />
              {erros.telefone && <p className="text-xs text-red-500 mt-0.5">{erros.telefone}</p>}
            </div>

            {/* Senha com botão de visibilidade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.senha}
                  onChange={e => handleChange('senha', e.target.value)}
                  onBlur={() => handleBlur('senha')}
                  placeholder="••••••••"
                  className={classeInput(erros.senha) + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.senha && (() => {
                const { label, cor, largura } = infoForca(avaliarForca(form.senha))
                return (
                  <div className="mt-1.5">
                    <div className="h-1.5 w-full rounded-full bg-[#2a2a2a]/10">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${cor} ${largura}`} />
                    </div>
                    <p className={`text-xs mt-0.5 ${cor.replace('bg-', 'text-')}`}>{label}</p>
                  </div>
                )
              })()}
              {erros.senha && <p className="text-xs text-red-500 mt-0.5">{erros.senha}</p>}
            </div>

            {/* Confirmação de senha com botão de visibilidade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#2a2a2a]/60 uppercase tracking-wide">Confirmar senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={form.confirmar_senha}
                  onChange={e => handleChange('confirmar_senha', e.target.value)}
                  onBlur={() => handleBlur('confirmar_senha')}
                  placeholder="••••••••"
                  className={classeInput(erros.confirmar_senha) + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/30 hover:text-[#2a2a2a]/60 transition-colors"
                >
                  {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {erros.confirmar_senha && <p className="text-xs text-red-500 mt-0.5">{erros.confirmar_senha}</p>}
            </div>

            {/* Aceite da política de privacidade */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-3">
                <input
                  id="privacidade"
                  type="checkbox"
                  checked={privacidadeAceita}
                  onChange={e => {
                    setPrivacidadeAceita(e.target.checked)
                    if (e.target.checked) setErros(prev => ({ ...prev, privacidade: '' }))
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#2a2a2a]/20 accent-[#3cb478] cursor-pointer shrink-0"
                />
                <label htmlFor="privacidade" className="text-sm text-[#2a2a2a]/50 leading-snug cursor-pointer">
                  Li e estou ciente da{' '}
                  <button
                    type="button"
                    onClick={() => setModalPrivacidade(true)}
                    className="text-[#3cb478] font-medium hover:underline"
                  >
                    Política de Privacidade
                  </button>
                  .
                </label>
              </div>
              {erros.privacidade && <p className="text-xs text-red-500 mt-0.5">{erros.privacidade}</p>}
            </div>

            {/* Erro geral retornado pela API */}
            {erroGeral && <p className="text-sm text-red-500 text-center">{erroGeral}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Cadastrando...' : 'Criar conta'}
            </button>
          </form>

          {/* Link para a página de login */}
          <p className="mt-6 text-center text-sm text-[#2a2a2a]/40">
            Já tem conta?{' '}
            <Link to="/login" className="text-[#3cb478] font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
