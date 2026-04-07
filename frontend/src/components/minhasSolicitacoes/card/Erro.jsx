import { RefreshCw } from 'lucide-react'

const painel = 'rounded-xl border border-black/6 bg-white px-8 py-10 text-center'

export default function Erro({ mensagem, onTentarNovamente }) {
  return (
    <div className="py-10">
      <div className={painel}>
        <p className="text-sm leading-relaxed text-[#2a2a2a]/70">{mensagem}</p>
        <button
          type="button"
          onClick={onTentarNovamente}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#3cb478] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#349d69]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
