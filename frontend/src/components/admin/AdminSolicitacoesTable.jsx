import { Circle } from 'lucide-react'
import { STATUS_ICONE, STATUS_LABEL, formatarData } from '../../utils/solicitacaoStatus'
import { iconeCategoria } from '../../utils/categoriaIcone'

export default function AdminSolicitacoesTable({
  itens,
  categoriasPorId,
  onRowClick,
  onGerenciarClick,
  rowClassName,
  showSolicitante = false,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/8 text-xs text-[#2a2a2a]/40 uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Protocolo</th>
            <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Categoria</th>
            <th className="text-left px-4 py-3 font-medium w-px whitespace-nowrap">Status</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Endereço</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell whitespace-nowrap">Data</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Apoios</th>
            {showSolicitante && (
              <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Solicitante</th>
            )}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {itens.map((item) => {
            const cat = categoriasPorId[item.id_categoria]
            const IconeCategoria = iconeCategoria(cat?.nome_categoria)
            const IconeStatus = STATUS_ICONE[item.status] ?? Circle
            return (
              <tr
                key={item.id_solicitacao}
                onClick={() => onRowClick?.(item)}
                className={rowClassName ? rowClassName(item) : 'cursor-pointer transition-colors hover:bg-[#2a2a2a]/2'}
              >
                <td className="px-4 py-3 font-mono text-xs text-[#2a2a2a]/60 w-px whitespace-nowrap">
                  #{item.protocolo}
                </td>
                <td className="px-4 py-3 w-px whitespace-nowrap">
                  {cat && (
                    <span
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70"
                      style={{ borderColor: cat.cor_hex }}
                    >
                      <IconeCategoria className="h-3.5 w-3.5 shrink-0" style={{ color: cat.cor_hex }} />
                      {cat.nome_categoria}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 w-px whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-3 py-1 text-sm font-medium text-[#2a2a2a]/70">
                    <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" />
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#2a2a2a]/60 hidden md:table-cell">
                  {item.endereco_referencia}
                </td>
                <td className="px-4 py-3 text-[#2a2a2a]/50 whitespace-nowrap hidden lg:table-cell">
                  {formatarData(item.data_registro)}
                </td>
                <td className="px-4 py-3 text-[#2a2a2a]/50 hidden lg:table-cell">
                  {item.contador_apoios ?? 0}
                </td>
                {showSolicitante && (
                  <td className="px-4 py-3 text-[#2a2a2a]/60 hidden xl:table-cell">
                    {item.nome_autor ?? '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onGerenciarClick?.(item)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#3cb478]/40 text-[#3cb478] hover:bg-[#3cb478]/8 transition-colors font-medium"
                  >
                    Gerenciar
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
