import { Link } from 'react-router-dom'
import { MapPin, FileText, Users, Shield, ArrowRight } from 'lucide-react'

const features = [
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

      {/* Header sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto px-8 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(161,93%,30%)]">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#171717]">Connect Cidade</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[#171717]/60 hover:text-[#171717] transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[hsl(161,93%,30%)] text-white hover:bg-[hsl(161,93%,25%)] transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="py-20 lg:py-32"
        style={{
          background: 'linear-gradient(135deg, rgba(52,184,109,0.10) 0%, hsl(0,0%,96%) 50%, rgba(237,250,246,0.30) 100%)'
        }}
      >
        <div className="mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <div className="max-w-3xl mx-auto text-center">
           {/* <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(161,93%,30%)]/10 px-4 py-2 text-sm font-medium text-[hsl(161,93%,30%)] mb-6">
              <MapPin className="h-4 w-4" />
              Plataforma Cidadã
            </div>
*/}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#171717] mb-6 leading-tight">
              Conecte-se com sua{' '}
              <span className="text-[hsl(161,93%,30%)]">Cidade</span>
            </h1>

            <p className="text-lg md:text-xl text-[#171717]/55 mb-8 max-w-2xl mx-auto">
              Reporte problemas urbanos de forma simples e rápida. Acompanhe o status das suas solicitações e ajude a construir uma cidade melhor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(161,93%,30%)] text-white font-semibold text-base hover:bg-[hsl(161,93%,25%)] active:scale-[0.98] transition-all"
              >
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#171717]/20 text-[#171717]/70 font-semibold text-base hover:border-[#171717]/40 hover:text-[#171717] transition-all"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ backgroundColor: 'hsl(0, 0%, 96%)' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#171717] mb-4">
            Como Funciona
          </h2>
          <p className="text-[#171717]/50 text-center mb-10 max-w-2xl mx-auto">
            Uma plataforma simples e eficiente para conectar cidadãos e gestão pública
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feat, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border hover:shadow-lg transition-shadow"
                style={{ backgroundColor: 'hsl(0,0%,98%)', borderColor: 'hsl(0,0%,83%)' }}
              >
                <div className="w-12 h-12 rounded-lg bg-[hsl(161,93%,30%)]/10 flex items-center justify-center mb-4">
                  <feat.icon className="h-6 w-6 text-[hsl(161,93%,30%)]" />
                </div>
                <h3 className="font-semibold text-lg text-[#171717] mb-2">{feat.title}</h3>
                <p className="text-[#171717]/50 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[hsl(161,93%,30%)]">
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '1400px' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Faça parte da transformação
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Junte-se a cidadãos que já estão melhorando nossa cidade
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[hsl(161,93%,30%)] font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Criar minha conta
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid hsl(0,0%,83%)' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '1400px' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(161,93%,30%)]">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[#171717]">Connect Cidade</span>
            </div>
            <p className="text-sm text-[#171717]/40">
              2026 Connect Cidade. Projeto acadêmico — Uniftec.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
