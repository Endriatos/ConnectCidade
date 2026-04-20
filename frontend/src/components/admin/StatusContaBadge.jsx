const STATUS_CONTA = {
  0: { label: 'Pendente', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  1: { label: 'Ativada', cls: 'border-[#3cb478]/40 bg-[#3cb478]/6 text-[#3cb478]' },
  2: { label: 'Bloqueada', cls: 'border-red-200 bg-red-50 text-red-600' },
}

export default function StatusContaBadge({ status }) {
  const cfg = STATUS_CONTA[status] ?? STATUS_CONTA[0]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
