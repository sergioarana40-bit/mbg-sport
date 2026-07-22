import { useState } from 'react'

// Rayas diagonales claras del póster 1b para cuando no hay foto.
const STRIPES = {
  background:
    'repeating-linear-gradient(45deg,#f8f8f8,#f8f8f8 12px,#efefef 12px,#efefef 24px)',
}

// Muestra la foto del producto; si no hay o falla, muestra un placeholder de marca.
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={showImage ? undefined : STRIPES}
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
        <img src="/brand/isotipo.png" alt="" className="w-1/2 opacity-80" loading="lazy" />
      )}
    </div>
  )
}
