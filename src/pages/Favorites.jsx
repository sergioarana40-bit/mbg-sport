import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ArrowRight, ShoppingCart, Check } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import FavoriteButton from '../components/FavoriteButton'
import Spinner from '../components/Spinner'
import { useFavorites } from '../context/FavoritesContext'
import { useCart } from '../context/CartContext'
import { getProductsByIds } from '../lib/api'
import { formatPrice } from '../config'

// Tarjeta de favorito (diseño 08): corazón arriba-derecha + botón "Agregar" oscuro.
function FavoriteCard({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock === 0

  function handleAdd(e) {
    e.preventDefault()
    if (outOfStock) return
    addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-[15px] border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand-500/40"
    >
      <div className="relative">
        <ProductImage src={product.image_url} alt={product.name} className="aspect-square" />
        <FavoriteButton
          productId={product.id}
          size={4}
          className="absolute right-2 top-2 h-[30px] w-[30px] bg-ink/70 text-brand-500"
        />
        {outOfStock && <span className="badge-out absolute bottom-2 left-2">Agotado</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.category_name && (
          <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-400">
            {product.category_name}
          </span>
        )}
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-fg transition group-hover:text-brand-400">
          {product.name}
        </h3>
        <span className="mt-0.5 font-display text-lg font-bold text-fg">
          {formatPrice(product.price)}
        </span>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`mt-1.5 flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] font-semibold transition ${
            outOfStock
              ? 'cursor-not-allowed bg-surface-2 text-fg-subtle'
              : added
                ? 'bg-emerald-600 text-white'
                : 'bg-surface-3 text-fg hover:bg-surface-2 active:scale-[.98]'
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" strokeWidth={1.8} />
              {outOfStock ? 'Agotado' : 'Agregar'}
            </>
          )}
        </button>
      </div>
    </Link>
  )
}

export default function Favorites() {
  const { ids, count } = useFavorites()
  const { addItem } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedAll, setAddedAll] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProductsByIds([...ids])
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
    // Recarga cuando cambia el tamaño del set (agregar/quitar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const inStock = products.filter((p) => (p.stock ?? 0) > 0)

  function addAll() {
    inStock.forEach((p) => addItem(p, 1))
    setAddedAll(true)
    setTimeout(() => setAddedAll(false), 1400)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Favoritos
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {count} producto{count === 1 ? '' : 's'} guardado{count === 1 ? '' : 's'}
          </p>
        </div>
        {/* Agregar todo (diseño 08) */}
        {inStock.length > 0 && (
          <button
            onClick={addAll}
            className={`inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-[.98] ${
              addedAll ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {addedAll ? (
              <>
                <Check className="h-4 w-4" /> Agregado
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" strokeWidth={1.8} />
                Agregar todo
              </>
            )}
          </button>
        )}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((p) => (
            <FavoriteCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
