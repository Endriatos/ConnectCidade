import { Loader2 } from 'lucide-react'

const painel = 'rounded-xl border border-black/6 bg-white px-8 py-10'

export default function Carregando() {
  return (
    <div className="py-10">
      <div className={`flex flex-col items-center gap-4 ${painel}`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#3cb478]" aria-hidden />
        <p className="text-sm text-[#2a2a2a]/50">Carregando solicitações…</p>
      </div>
    </div>
  )
}
