import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { useFavorites } from '../context/FavoritesContext'
import { getProductsByIds } from '../lib/api'

export default function Favorites() {
  const { ids, count } = useFavorites()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProductsByIds([...ids])
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
    // Recarga cuando cambia el tamaño del set (agregar/quitar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Favoritos
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {count} producto{count === 1 ? '' : 's'} guardado{count === 1 ? '' : 's'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-2">
            <Heart className="h-8 w-8 text-fg-subtle" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-fg">
            Aún no tienes favoritos
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            Toca el corazón en cualquier producto para guardarlo aquí.
          </p>
          <Link to="/catalogo" className="btn-primary mt-6">
            Explorar catálogo
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
