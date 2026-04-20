import { AlertTriangle } from 'lucide-react'

export default function InlineNotice({ children }) {
  return (
    <div className="flex items-center gap-2 border-l-2 border-amber-500/60 pl-3">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600/80" aria-hidden />
      <p className="min-w-0 text-xs leading-relaxed text-[#2a2a2a]/60">{children}</p>
    </div>
  )
}
