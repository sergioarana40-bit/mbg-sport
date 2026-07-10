import { Heart } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext'

// Botón de corazón para marcar/desmarcar un producto como favorito.
export default function FavoriteButton({ productId, className = '', size = 5 }) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(productId)

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    toggle(productId)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={fav}
      className={`grid place-items-center rounded-lg transition active:scale-90 ${className}`}
    >
      <Heart
        className={`transition ${fav ? 'fill-brand-600 text-brand-600' : ''}`}
        style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
      />
    </button>
  )
}
