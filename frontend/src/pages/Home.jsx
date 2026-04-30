import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Header from '../components/Header';
import Mapa from './Mapa';

export default function Home() {
  const nome = useAuthStore((s) => s.nome);

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário';
  const nomeSaudacao = primeiroNome
    ? `${primeiroNome.charAt(0).toUpperCase()}${primeiroNome.slice(1)}`
    : 'Usuário';

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />

      {/* Conteúdo */}
      <main className="flex-1">
        <div
          className="mx-auto px-6 py-6 flex flex-col gap-5"
          style={{ maxWidth: '1400px' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#2a2a2a]">
                Olá, {nomeSaudacao}!
              </h1>
              <p className="text-sm text-[#2a2a2a]/50 mt-0.5">
                Veja os problemas reportados na sua região
              </p>
            </div>
            <Link
              to="/nova-solicitacao"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3cb478] text-white text-sm font-medium hover:bg-[#349d69] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Registrar Problema
            </Link>
          </div>

          {/* Mapa */}
          <div
            className="rounded-2xl overflow-hidden border border-black/8 shadow-sm"
            style={{ height: '70vh' }}
          >
            <Mapa />
          </div>
        </div>
      </main>
    </div>
  );
}
