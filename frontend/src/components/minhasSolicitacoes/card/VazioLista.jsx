import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'

const painel = 'rounded-xl border border-black/6 bg-white px-8 py-10 text-center'

export default function VazioLista() {
  return (
    <div className="py-10">
      <div className={painel}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3cb478]/10">
          <ClipboardList className="h-7 w-7 text-[#3cb478]" aria-hidden />
        </div>
        <p className="text-lg font-semibold text-[#2a2a2a]">Nenhuma solicitação ainda</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#2a2a2a]/50">
          Quando você registrar um problema na cidade, ele aparecerá aqui para acompanhamento.
        </p>
        <Link
          to="/nova-solicitacao"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#3cb478] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#349d69]"
        >
          Registrar problema
        </Link>
      </div>
    </div>
  )
}
