import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { opcoesFiltro } from '../../../utils/solicitacaoStatus'

const estiloPillCategoria = (ativo) =>
  `inline-flex max-w-full min-w-0 shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
    ativo ? 'border-[#2a2a2a]/20 bg-[#f5f5f5] text-[#2a2a2a]' : 'border-transparent text-[#2a2a2ab3]'
  }`

const estiloPillStatus = (ativo) => ({
  backgroundColor: ativo ? '#f5f5f5' : 'transparent',
  color: ativo ? '#2a2a2a' : '#2a2a2ab3',
  borderColor: ativo ? '#2a2a2a18' : 'transparent',
})

function RotuloSecao({ titulo }) {
  return (
    <div className="flex items-center gap-2">
      <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-[#2a2a2a]/50">
        {titulo}
      </p>
      <div className="h-px flex-1 bg-black/8" />
    </div>
  )
}

export default function Filtro({
  statusFiltro,
  onStatusFiltroChange,
  categoriaFiltro,
  onCategoriaFiltroChange,
  categoriasDisponiveis,
}) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const categorias = categoriasDisponiveis ?? []

  return (
    <div className="w-full py-3">
      <div className="flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-black/6 bg-white">
        <button
          type="button"
          onClick={() => setFiltrosAbertos((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-[#fafafa] sm:px-4"
          aria-expanded={filtrosAbertos}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#2a2a2a]/40" aria-hidden />
            <span className="text-sm font-medium text-[#2a2a2a]/80">Filtrar lista</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#2a2a2a]/40 transition-transform duration-200 ${
              filtrosAbertos ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            filtrosAbertos ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-black/6 px-3 pb-4 pt-3 sm:px-4">
              <div
                className={`flex w-full min-w-0 gap-x-8 gap-y-4 ${
                  categorias.length > 0
                    ? 'flex-wrap items-start'
                    : 'flex-col'
                }`}
              >
                <div
                  className={`min-w-0 space-y-3 ${
                    categorias.length > 0
                      ? 'max-w-full flex-[1_1_min(100%,18rem)]'
                      : ''
                  }`}
                >
                  <RotuloSecao titulo="Status" />
                  <div className="flex min-w-0 max-w-full flex-wrap gap-1.5">
                    {opcoesFiltro.map((opcao) => {
                      const ativo = statusFiltro === opcao.id
                      return (
                        <button
                          key={opcao.id}
                          type="button"
                          onClick={() => onStatusFiltroChange(opcao.id)}
                          className="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs font-medium transition-colors"
                          style={estiloPillStatus(ativo)}
                        >
                          {opcao.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {categorias.length > 0 && (
                  <div className="min-w-0 max-w-full flex-[1_1_min(100%,18rem)] space-y-3">
                    <RotuloSecao titulo="Categoria" />
                    <div className="flex min-w-0 max-w-full flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onCategoriaFiltroChange(null)}
                        className={estiloPillCategoria(categoriaFiltro === null)}
                      >
                        <span
                          className="grid h-4 w-4 shrink-0 grid-cols-2 gap-px overflow-hidden rounded-sm"
                          aria-hidden
                        >
                          {categorias.slice(0, 4).map((cat) => (
                            <span
                              key={cat.id_categoria}
                              className="transition-opacity duration-200"
                              style={{
                                backgroundColor: cat.cor_hex ?? '#3cb478',
                                opacity: categoriaFiltro === null ? 1 : 0.25,
                              }}
                            />
                          ))}
                        </span>
                        <span className="max-w-[12rem] truncate">Todas as categorias</span>
                      </button>
                      {categorias.map((c) => (
                        <button
                          key={c.id_categoria}
                          type="button"
                          onClick={() => onCategoriaFiltroChange(c.id_categoria)}
                          className={estiloPillCategoria(categoriaFiltro === c.id_categoria)}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: c.cor_hex ?? '#3cb478' }}
                            aria-hidden
                          />
                          <span className="max-w-[12rem] truncate">{c.nome_categoria}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
