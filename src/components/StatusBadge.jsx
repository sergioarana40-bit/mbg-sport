import { ORDER_STATUS } from '../config'

// Píldora de estado estilo póster: borde negro + punto de color.
// Clases completas para que Tailwind las detecte (no concatenar dinámicamente).
const DOT = {
  amber: 'bg-state-pending',
  emerald: 'bg-state-paid',
  blue: 'bg-state-progress',
  indigo: 'bg-state-shipped',
  green: 'bg-state-paid',
  red: 'bg-brand-600',
}

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, color: 'neutral' }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-display text-[10px] font-extrabold uppercase text-fg">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${DOT[s.color] || 'bg-fg-subtle'}`}
      />
      {s.label}
    </span>
  )
}
