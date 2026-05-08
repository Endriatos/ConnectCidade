import { Star } from 'lucide-react'
import {
  COR_MARCADOR_AVALIACAO,
  COR_MARCADOR_HISTORICO,
  STATUS_ICONE,
  formatarDataHora,
} from '../../../utils/solicitacaoStatus'

function CentroMarcador({ children }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 leading-none">
      {children}
    </span>
  )
}

function MarcaConcluido() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MarcaPrevisto() {
  return (
    <span className="block h-2 w-2 rounded-full bg-[#2a2a2a]/40" aria-hidden />
  )
}

export default function Item({
  ultimo,
  tipo,
  estado,
  titulo,
  descricao,
  data,
  dataLabel,
  autor,
  status,
  cor = COR_MARCADOR_HISTORICO,
  nota,
  textoAvaliacao,
  textoIndicacaoResolucao,
  destaque = false,
  itemRef = null,
}) {
  const previsto = tipo === 'previsto'
  const destaqueAtual = estado === 'atual'
  const concluido = !previsto || estado === 'concluido'
  const opacidade = previsto ? (estado === 'previsto' ? 'opacity-55' : 'opacity-80') : 'opacity-100'
  const classeBordaNo =
    destaqueAtual
      ? 'border-white/90'
      : concluido
        ? 'border-white/80'
        : 'border-dashed border-[#2a2a2a]/20'
  const preenchido = destaqueAtual || concluido
  const corMarcador = tipo === 'avaliacao' ? COR_MARCADOR_AVALIACAO : cor
  const fundoMarcador = preenchido
    ? corMarcador
    : tipo === 'avaliacao'
      ? 'rgba(251, 191, 36, 0.2)'
      : 'rgba(60, 180, 120, 0.14)'
  const IconeStatus = status ? STATUS_ICONE[status] : null

  return (
    <li
      ref={itemRef}
      className={`relative flex gap-4 pb-10 last:pb-0 ${opacidade}`}
    >
      <div className="relative flex w-4 shrink-0 flex-col items-center">
        <span
          className={`relative z-10 mt-0.5 box-border h-5 w-5 shrink-0 rounded-full border ${classeBordaNo}`}
          style={{ backgroundColor: fundoMarcador }}
        >
          <CentroMarcador>
            {previsto ? (
              <MarcaPrevisto />
            ) : tipo === 'criacao' ? (
              <MarcaConcluido />
            ) : tipo === 'avaliacao' ? (
              <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={0} aria-hidden />
            ) : IconeStatus ? (
              <IconeStatus className="h-3 w-3 text-white" strokeWidth={2.5} aria-hidden />
            ) : (
              <MarcaConcluido />
            )}
          </CentroMarcador>
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
        <p className={`mt-1 text-sm text-[#2a2a2a] ${previsto ? 'font-medium' : 'font-semibold'}`}>
          {titulo}
        </p>
        {tipo === 'avaliacao' && nota != null && (
          <div className="mt-1.5 flex gap-0.5" aria-hidden>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= nota ? 'fill-amber-400 text-amber-500' : 'fill-transparent text-[#2a2a2a]/12'
                }`}
                strokeWidth={n <= nota ? 0 : 1.25}
              />
            ))}
          </div>
        )}
        {tipo === 'avaliacao' ? (
          <>
            {textoAvaliacao ? (
              <p className="mt-1 text-sm leading-relaxed text-[#2a2a2a]/65">{textoAvaliacao}</p>
            ) : null}
            <p
              className={`text-sm leading-relaxed text-[#2a2a2a]/55 ${textoAvaliacao ? 'mt-2' : 'mt-1'}`}
            >
              {textoIndicacaoResolucao}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-[#2a2a2a]/65">{descricao}</p>
        )}
        {autor && (
          <p className="mt-2 text-xs text-[#2a2a2a]/45">Por {autor}</p>
        )}
      </div>
    </li>
  )
}
