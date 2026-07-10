import { useState } from 'react'
import { Dumbbell } from 'lucide-react'

// Muestra la foto del producto; si no hay o falla, muestra un placeholder de marca.
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface-2 to-surface ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-fg-subtle">
          <Dumbbell className="h-10 w-10" strokeWidth={1.5} />
          <span className="px-3 text-center text-xs font-medium uppercase tracking-wide">
            MBG Sport
          </span>
        </div>
      )}
    </div>
  )
}
