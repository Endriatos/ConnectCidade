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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f5f5f5]">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-5">
          <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-lg font-semibold leading-none text-[#2a2a2a] sm:text-2xl">
              Olá, {nomeSaudacao}!
            </h1>
            <Link
              to="/nova-solicitacao"
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#349d69]"
            >
              <Plus className="h-4 w-4" />
            </Link>
            <p className="col-span-2 text-xs leading-snug text-[#2a2a2a]/50 sm:text-sm pb-2">
              Veja os problemas reportados na sua região
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-black/8 shadow-sm sm:rounded-2xl">
            <Mapa />
          </div>
        </div>
      </main>
    </div>
  );
}
