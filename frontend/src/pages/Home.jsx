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

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#2a2a2a] sm:text-2xl">
                Olá, {nomeSaudacao}!
              </h1>
              <p className="mt-0.5 text-sm text-[#2a2a2a]/50">
                Veja os problemas reportados na sua região
              </p>
            </div>
            <Link
              to="/nova-solicitacao"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#349d69]"
            >
              <Plus className="h-4 w-4" />
              Registrar Problema
            </Link>
          </div>

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
