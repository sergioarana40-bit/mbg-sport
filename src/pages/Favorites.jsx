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
      className="group flex flex-col overflow-hidden rounded-[10px] border-2 border-ink bg-white shadow-hard-sm transition hover:-translate-y-0.5 lg:shadow-hard"
    >
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square border-b-2 border-ink"
        />
        <FavoriteButton
          productId={product.id}
          size={4}
          className="absolute right-2 top-2 h-[34px] w-[34px] rounded-lg border-2 border-ink bg-white text-fg"
        />
        {outOfStock && <span className="badge-out absolute bottom-2 left-2">Agotado</span>}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        {product.category_name && (
          <span className="text-[10px] font-bold uppercase tracking-[.12em] text-fg-subtle">
            {product.category_name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug text-fg">
          {product.name}
        </h3>
        <span className="price-tag mt-2 self-start text-base">{formatPrice(product.price)}</span>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`mt-3 flex h-[38px] items-center justify-center gap-2 rounded-lg font-display text-[11.5px] font-extrabold uppercase transition ${
            outOfStock
              ? 'cursor-not-allowed border-2 border-[#d9d9d9] bg-white text-fg-subtle'
              : added
                ? 'bg-state-paid text-white'
                : 'bg-ink text-white hover:bg-ink-2 active:scale-[.98]'
          }`}
        >
          {added ? (
            <>
              <Check className="h-3.5 w-3.5" /> Agregado
            </>
          ) : outOfStock ? (
            'Agotado'
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
              Agregar
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-stamp text-lg sm:text-2xl">
            <span>Favoritos</span>
          </h1>
          <p className="mt-2.5 text-[12.5px] font-medium text-fg-subtle">
            {count} producto{count === 1 ? '' : 's'} guardado{count === 1 ? '' : 's'}
          </p>
        </div>
        {/* Agregar todo */}
        {inStock.length > 0 && (
          <button
            onClick={addAll}
            className={`inline-flex items-center gap-2 rounded-[10px] border-2 border-ink px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              addedAll ? 'bg-state-paid' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {addedAll ? (
              <>
                <Check className="h-4 w-4" /> Agregado
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" strokeWidth={2} />
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
          <div className="sticker mx-auto grid h-16 w-16 place-items-center rounded-full">
            <Heart className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="mt-5 font-display text-xl font-extrabold text-fg">
            Aún no tienes favoritos
          </h2>
          <p className="mt-2 text-sm font-medium text-fg-muted">
            Toca el corazón en cualquier producto para guardarlo aquí.
          </p>
          <Link to="/catalogo" className="btn-sticker mt-6">
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
