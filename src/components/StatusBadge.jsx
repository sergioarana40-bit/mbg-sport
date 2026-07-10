import { ORDER_STATUS } from '../config'

// Clases completas para que Tailwind las detecte (no concatenar dinámicamente).
const COLORS = {
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, color: 'neutral' }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        COLORS[s.color] || 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {s.label}
    </span>
  )
}
