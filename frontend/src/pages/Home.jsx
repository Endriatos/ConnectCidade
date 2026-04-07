import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Header from '../components/Header';
import Mapa from './Mapa';
import { iconeCategoria } from '../utils/categoriaIcone';

export default function Home() {
  const { nome } = useAuthStore();
  const location = useLocation();

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário';
  const [modalAberto, setModalAberto] = useState(
    location.state?.recemCadastrado === true,
  );
  const [categoriasLegenda, setCategoriasLegenda] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [categoriaHover, setCategoriaHover] = useState(undefined);
  const [filtroEmHover, setFiltroEmHover] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />

      {/* Conteúdo */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 flex flex-col gap-8">
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
          <div className="relative">
            {categoriasLegenda.length > 0 && (() => {
              const opcoes = [
                { id: null, Icone: null, cor: null, nome: 'Todas as categorias' },
                ...categoriasLegenda.map((cat) => ({ id: cat.id_categoria, Icone: iconeCategoria(cat.nome_categoria), cor: cat.cor_hex, nome: cat.nome_categoria })),
              ];
              const idxAtivo = opcoes.findIndex((o) => o.id === categoriaFiltro);
              const nomeAtivo = opcoes.find((o) => o.id === categoriaFiltro)?.nome ?? 'Todas as categorias';
              const nomeHover = opcoes.find((o) => o.id === categoriaHover)?.nome;
              const larguraPillCh = Math.max(...opcoes.map((o) => `Filtro: ${o.nome}`.length)) + 2;
              const tamanho = 36;
              const gap = 6;
              return (
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-[1000] bg-white/90 backdrop-blur-sm shadow-md rounded-full px-1.5 py-1.5">
                  <div
                    className="relative flex items-center"
                    style={{ gap }}
                    onMouseEnter={() => setFiltroEmHover(true)}
                    onMouseLeave={() => {
                      setFiltroEmHover(false);
                      setCategoriaHover(undefined);
                    }}
                  >
                    <div
                      className="absolute rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        width: tamanho,
                        height: tamanho,
                        transform: `translateX(${idxAtivo * (tamanho + gap)}px)`,
                        backgroundColor: opcoes[idxAtivo]?.cor ? `${opcoes[idxAtivo].cor}25` : '#3cb47825',
                        border: `2px solid ${opcoes[idxAtivo]?.cor ?? '#3cb478'}`,
                      }}
                    />
                    {opcoes.map((opcao) => {
                      const ativo = categoriaFiltro === opcao.id;
                      const emHover = categoriaHover === opcao.id;
                      return (
                        <button
                          key={opcao.id ?? 'todos'}
                          onClick={() => {
                            setCategoriaFiltro(opcao.id);
                            setCategoriaHover(undefined);
                          }}
                          aria-label={opcao.nome}
                          onMouseEnter={() => {
                            setCategoriaHover(opcao.id);
                          }}
                          onMouseLeave={() => {
                            setCategoriaHover(undefined);
                          }}
                          className="relative z-10 flex items-center justify-center transition-colors duration-300"
                          style={{ width: tamanho, height: tamanho }}
                        >
                          {opcao.Icone ? (
                            <opcao.Icone
                              className="h-4 w-4 transition-colors duration-300"
                              style={{ color: ativo || emHover ? opcao.cor : '#2a2a2a40' }}
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-px w-4 h-4 rounded-sm overflow-hidden">
                              {categoriasLegenda.slice(0, 4).map((cat) => (
                                <div
                                  key={cat.id_categoria}
                                  className="transition-opacity duration-300"
                                  style={{
                                    backgroundColor: cat.cor_hex,
                                    opacity: ativo || emHover ? 1 : 0.25,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {filtroEmHover && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-0.5 pointer-events-none">
                      <div
                        className="rounded-full border border-black/8 bg-white/90 backdrop-blur-sm text-[#2a2a2a]/65 text-[11px] font-medium px-2.5 py-0.5 text-center whitespace-nowrap"
                        style={{ width: `${larguraPillCh}ch` }}
                      >
                        FILTRO: {nomeHover ?? nomeAtivo}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div
              className="rounded-2xl overflow-hidden border border-black/8 shadow-sm"
              style={{ height: '70vh' }}
            >
              <Mapa onCategoriasChange={setCategoriasLegenda} categoriaFiltro={categoriaFiltro} />
            </div>
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
