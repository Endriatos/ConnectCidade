import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Header from '../components/Header';
import Mapa from './Mapa';

export default function Home() {
  const { nome } = useAuthStore();
  const location = useLocation();

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário';
  const [modalAberto, setModalAberto] = useState(
    location.state?.recemCadastrado === true,
  );

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
                Olá, {primeiroNome}!
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

      {/* Modal de boas-vindas após cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-sm text-center mx-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#3cb478]/10 mx-auto mb-5">
              <svg
                className="w-7 h-7 text-[#3cb478]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-[#2a2a2a] tracking-tight">
              Boas-vindas, {primeiroNome}!
            </p>
            <p className="mt-2 text-sm text-[#2a2a2a]/50">
              Sua conta foi criada com sucesso. Agora você já pode usar o
              Connect Cidade.
            </p>
            <button
              onClick={() => setModalAberto(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#3cb478] text-white font-medium text-sm hover:bg-[#349d69] active:scale-[0.98] transition-all"
            >
              Começar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
