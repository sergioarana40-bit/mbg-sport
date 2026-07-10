import { ORDER_STATUS } from '../config'

// Clases completas para que Tailwind las detecte (no concatenar dinámicamente).
const COLORS = {
  amber: 'bg-amber-500/15 text-amber-300',
  emerald: 'bg-emerald-500/15 text-emerald-300',
  blue: 'bg-blue-500/15 text-blue-300',
  indigo: 'bg-indigo-500/15 text-indigo-300',
  green: 'bg-green-500/15 text-green-300',
  red: 'bg-brand-600/20 text-brand-300',
}

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, color: 'neutral' }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        COLORS[s.color] || 'bg-surface-2 text-fg-muted'
      }`}
    >
      {s.label}
    </span>
  )
}
