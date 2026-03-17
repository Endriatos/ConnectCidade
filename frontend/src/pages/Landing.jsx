import { Link } from 'react-router-dom'
import { MapPin, FileText, Users, Shield, ArrowRight } from 'lucide-react'
import Lottie from 'lottie-react'
import logoCC from '../assets/logoCC.png'
import cityAnimation from '../assets/City.json'

// Cards de funcionalidades exibidos na seção "Como Funciona"
const funcionalidades = [
  {
    icon: MapPin,
    title: 'Mapeie Problemas',
    description: 'Registre problemas urbanos com fotos e localização exata via GPS.',
  },
  {
    icon: FileText,
    title: 'Acompanhe Status',
    description: 'Receba atualizações em tempo real sobre suas solicitações.',
  },
  {
    icon: Users,
    title: 'Apoie Demandas',
    description: 'Reforce solicitações de outros cidadãos para dar mais visibilidade.',
  },
  {
    icon: Shield,
    title: 'Transparência',
    description: 'Visualize todas as demandas da cidade e o andamento das soluções.',
  },
]

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* Header fixo no topo */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center">
            <img src={logoCC} alt="Connect Cidade" className="h-9" />
          </Link>
          <div className="flex items-center gap-3 translate-y-px">
            <Link
              to="/login"
              className="text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#3cb478] text-white hover:bg-[#349d69] transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — chamada principal com fundo verde escuro */}
      <section
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{ background: '#157040' }}
      >
        {/* Animação de fundo */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
          <Lottie
            animationData={cityAnimation}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <div className="relative mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Conecte-se com sua{' '}
              <span className="text-[#7ddda8]">Cidade</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Reporte problemas urbanos de forma simples e rápida. Acompanhe o status das suas solicitações e ajude a construir uma cidade melhor.
            </p>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#116b3c] font-semibold text-base hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/30 text-white/80 font-semibold text-base hover:border-white/60 hover:text-white transition-all"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Como Funciona" — lista os cards de funcionalidades */}
      <section className="py-16" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#2a2a2a] mb-4">
            Como Funciona
          </h2>
          <p className="text-[#2a2a2a]/50 text-center mb-10 max-w-2xl mx-auto">
            Uma plataforma simples e eficiente para conectar cidadãos e gestão pública
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {funcionalidades.map((funcionalidade, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border hover:shadow-lg transition-shadow"
                style={{ backgroundColor: '#fafafa', borderColor: '#d4d4d4' }}
              >
                <div className="w-12 h-12 rounded-lg bg-[#3cb478]/10 flex items-center justify-center mb-4">
                  <funcionalidade.icon className="h-6 w-6 text-[#3cb478]" />
                </div>
                <h3 className="font-semibold text-lg text-[#2a2a2a] mb-2">{funcionalidade.title}</h3>
                <p className="text-[#2a2a2a]/50 text-sm leading-relaxed">{funcionalidade.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — convite para cadastro */}
      <section className="py-16" style={{ background: '#157040' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '1400px' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Faça parte da transformação
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Junte-se a cidadãos que já estão melhorando nossa cidade.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#3cb478] font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Criar minha conta
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="py-8" style={{ borderTop: '1px solid #d4d4d4' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={logoCC} alt="Connect Cidade" className="h-8" />
            </div>
            <p className="text-sm text-[#2a2a2a]/40">
              2026 Connect Cidade. Projeto acadêmico — Uniftec.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
