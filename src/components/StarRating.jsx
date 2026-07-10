import { Star } from 'lucide-react'

// Estrellas de calificación. Si se pasa onChange, es interactivo (seleccionar).
export default function StarRating({ value = 0, size = 4, onChange, className = '' }) {
  const interactive = typeof onChange === 'function'
  const px = `${size * 4}px`

  return (
    <div className={`inline-flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value)
        const star = (
          <Star
            style={{ height: px, width: px }}
            strokeWidth={1.6}
            className={filled ? 'fill-accent-400 text-accent-400' : 'fill-transparent text-fg-subtle'}
          />
        )
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} de 5 estrellas`}
            className="transition hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}
