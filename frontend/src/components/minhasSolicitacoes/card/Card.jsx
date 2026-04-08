import { Link } from 'react-router-dom'
import { Circle, MapPin, ThumbsUp } from 'lucide-react'
import { STATUS_ICONE, STATUS_LABEL, formatarData } from '../../../utils/solicitacaoStatus'

export default function Card({ solicitacao, categoria }) {
  const nome_categoria = categoria?.nome_categoria
  const corCategoria = categoria?.cor_hex ?? '#3cb478'

  const {
    status,
    protocolo,
    id_solicitacao,
    descricao,
    endereco_referencia,
    data_registro,
    contador_apoios,
  } = solicitacao ?? {}

  const IconeStatus = STATUS_ICONE[status] ?? Circle
  const labelStatus = STATUS_LABEL[status] ?? status
  const nApoios = contador_apoios ?? 0

  return (
    <Link
      to={`/minhas-solicitacoes/${id_solicitacao}`}
      className="group relative block rounded-xl border border-black/6 bg-white px-5 py-4 transition-colors hover:bg-[#fafafa]"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <p className="text-lg font-semibold text-[#2a2a2a] tabular-nums leading-none min-w-0">
            {`#${protocolo}`}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/8 bg-white px-2.5 py-1 text-xs font-medium text-[#2a2a2a]/70">
            <IconeStatus className="h-3.5 w-3.5 text-[#2a2a2a]/55" aria-hidden />
            {labelStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {categoria && (
            <>
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-[#2a2a2ab3]">
                <span
                  className="inline-flex h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: corCategoria }}
                  aria-hidden
                />
                <span className="truncate">{nome_categoria}</span>
              </span>
              <span className="text-[#2a2a2a]/25 select-none" aria-hidden>
                ·
              </span>
            </>
          )}
          <span className="text-[#2a2a2a]/40">
            Criado em {formatarData(data_registro)}
          </span>
        </div>

        <p className="line-clamp-2 min-w-0 text-sm leading-relaxed text-[#2a2a2a]/70">
          {descricao}
        </p>

        <div className="flex items-end justify-between gap-3">
          <p className="flex min-w-0 flex-1 items-start gap-1.5 text-xs leading-snug text-[#2a2a2a]/65">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a2a2a]/40"
              aria-hidden
            />
            <span className="min-w-0">{endereco_referencia}</span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-[#2a2a2a]/50">
            <ThumbsUp className="h-3.5 w-3.5 text-[#2a2a2a]/40" aria-hidden />
            {nApoios} {nApoios === 1 ? 'apoio' : 'apoios'}
          </span>
        </div>
      </div>
    </Link>
  )
}
