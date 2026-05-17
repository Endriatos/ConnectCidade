import { STATUS_CONTA, STATUS_CONTA_PADRAO } from '../../constants/statusConta'

export default function StatusContaBadge({ status }) {
  const cfg = STATUS_CONTA[status] ?? STATUS_CONTA[STATUS_CONTA_PADRAO]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
