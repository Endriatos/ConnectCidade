import { Check, Circle, Clock3 } from 'lucide-react'
import { STATUS_ESTILO, STATUS_LABEL, formatarDataHora } from '../../../utils/solicitacaoStatus'

export default function Item({
  ultimo,
  tipo,
  estado,
  titulo,
  descricao,
  data,
  dataLabel,
  cor,
  autor,
}) {
  const previsto = tipo === 'previsto'
  const destaqueAtual = estado === 'atual'
  const concluido = !previsto || estado === 'concluido'
  const statusTag = tipo === 'atualizacao' ? titulo.split('→').pop()?.trim() : null
  const chaveStatus = Object.entries(STATUS_LABEL).find(([, label]) => label === statusTag)?.[0]
  const estiloStatus = chaveStatus ? STATUS_ESTILO[chaveStatus] : null
  const opacidade = previsto ? (estado === 'previsto' ? 'opacity-55' : 'opacity-80') : 'opacity-100'
  const classeBordaNo =
    destaqueAtual
      ? 'border-white ring-2 ring-black/5'
      : concluido
        ? 'border-white/80'
        : 'border-dashed border-[#2a2a2a]/20'

  return (
    <li className={`relative flex gap-4 pb-10 last:pb-0 ${opacidade}`}>
      <div className="relative flex w-4 shrink-0 flex-col items-center">
        <span
          className={`z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${classeBordaNo}`}
          style={{ backgroundColor: destaqueAtual || concluido ? cor : `${cor}24` }}
        >
          {destaqueAtual ? (
            <Clock3 className="h-3 w-3 animate-[pulse_1.8s_ease-in-out_infinite] text-white" aria-hidden />
          ) : concluido ? (
            <Check className="h-3 w-3 text-white" aria-hidden />
          ) : (
            <Circle className="h-2.5 w-2.5 fill-current text-[#2a2a2a]/35" aria-hidden />
          )}
        </span>
        {!ultimo && (
          <span
            className="absolute bottom-[-2.5rem] left-1/2 top-6 w-px -translate-x-1/2 bg-[#2a2a2a]/10"
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs tabular-nums text-[#2a2a2a]/45">
          {data ? formatarDataHora(data) : dataLabel}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className={`text-sm text-[#2a2a2a] ${previsto ? 'font-medium' : 'font-semibold'}`}>
            {titulo}
          </p>
          {estiloStatus && !previsto && (
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: estiloStatus.bg,
                color: estiloStatus.text,
                borderColor: estiloStatus.border,
              }}
            >
              {statusTag}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[#2a2a2a]/65">{descricao}</p>
        {autor && (
          <p className="mt-2 text-xs text-[#2a2a2a]/45">Por {autor}</p>
        )}
      </div>
    </li>
  )
}
