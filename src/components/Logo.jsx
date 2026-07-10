import { Link } from 'react-router-dom'

export default function Logo({ to = '/', light = false, className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 font-display text-base font-bold leading-none text-white shadow-sm ring-1 ring-black/10">
        MBG
      </span>
      <span
        className={`font-display text-xl font-bold uppercase leading-none tracking-tight ${
          light ? 'text-white' : 'text-fg'
        }`}
      >
        Sport
      </span>
    </Link>
  )
}
