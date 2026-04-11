import { AlertTriangle, Loader2, X } from 'lucide-react'
import ilustracaoEncerrarConta from '../../assets/ilustracaoEncerrarConta.png'

export default function ModalEncerrarConta({
  aberto,
  excluindo,
  erroExcluir,
  onFechar,
  onConfirmar,
}) {
  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !excluindo) onFechar()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#2a2a2a]/10 bg-white p-6 shadow-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-excluir-conta"
      >
        <button
          type="button"
          disabled={excluindo}
          onClick={onFechar}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#2a2a2a]/40 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]/70 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 id="titulo-excluir-conta" className="pr-10 text-lg font-semibold text-[#2a2a2a]">
          Confirmar encerramento
        </h3>
        <img
          src={ilustracaoEncerrarConta}
          alt=""
          className="mx-auto mt-4 h-auto max-h-40 w-full max-w-xs object-contain"
        />
        <div className="mt-3 flex flex-col items-center gap-3 px-1">
          <div className="flex items-start justify-center gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm font-medium text-[#2a2a2a]">Esta ação não pode ser desfeita.</p>
          </div>
          <p className="text-center text-sm leading-relaxed text-[#2a2a2a]/55">
            Sua conta será anonimizada e você perderá o acesso imediato à plataforma.
          </p>
        </div>
        {erroExcluir && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {erroExcluir}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={excluindo}
            onClick={onFechar}
            className="rounded-xl bg-[#3cb478] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#349d69] disabled:pointer-events-none disabled:opacity-45"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={excluindo}
            onClick={() => void onConfirmar()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-45"
          >
            {excluindo && <Loader2 className="h-4 w-4 animate-spin" />}
            Encerrar definitivamente
          </button>
        </div>
      </div>
    </div>
  )
}
