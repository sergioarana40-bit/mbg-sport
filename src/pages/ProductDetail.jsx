import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Check, ChevronRight, Store, Truck } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import FavoriteButton from '../components/FavoriteButton'
import ProductReviews from '../components/ProductReviews'
import StarRating from '../components/StarRating'
import Spinner from '../components/Spinner'
import { getProductById } from '../lib/api'
import { formatPrice, STORE } from '../config'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [reviewSummary, setReviewSummary] = useState(null)

  useEffect(() => {
    setLoading(true)
    setQty(1)
    getProductById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-fg">Producto no encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-brand-400 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const outOfStock = product.stock === 0
  const maxQty = Math.min(product.stock ?? 99, 99)

  function handleAdd() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  function buyNow() {
    addItem(product, qty)
    navigate('/carrito')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-fg-muted">
        <Link to="/" className="hover:text-brand-400">
          Inicio
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/catalogo" className="hover:text-brand-400">
          Catálogo
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-fg">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="aspect-square rounded-2xl border border-line"
          />
          <FavoriteButton
            productId={product.id}
            className="absolute right-3 top-3 h-10 w-10 bg-ink/50 text-white backdrop-blur hover:bg-ink/70"
          />
        </div>

        <div>
          {product.category_name && (
            <span className="text-sm font-medium uppercase tracking-wide text-brand-400">
              {product.category_name}
            </span>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-fg">
            {product.name}
          </h1>

          {/* Calificación (diseño 04): estrellas + "4.8 · 128 reseñas" */}
          <a href="#resenas" className="mt-2.5 inline-flex items-center gap-2 hover:opacity-80">
            <StarRating value={reviewSummary?.avg ?? 0} size={3.75} />
            <span className="text-[13px] text-fg-muted">
              {reviewSummary?.count
                ? `${reviewSummary.avg.toFixed(1)} · ${reviewSummary.count} reseña${
                    reviewSummary.count === 1 ? '' : 's'
                  }`
                : 'Sé el primero en reseñar'}
            </span>
          </a>

          <p className="mt-4 font-display text-3xl font-bold text-fg">
            {formatPrice(product.price)}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
            {outOfStock ? (
              <span className="font-medium text-brand-500">Agotado</span>
            ) : (
              <>
                <Check className="h-[15px] w-[15px] text-emerald-400" strokeWidth={2.5} />
                <span className="text-emerald-400">{product.stock} disponibles</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-fg-muted">{product.description}</p>
          )}

          {/* Cantidad + acciones */}
          {!outOfStock && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-line">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-11 w-11 place-items-center text-fg-muted hover:bg-surface-2 disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-fg">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="grid h-11 w-11 place-items-center text-fg-muted hover:bg-surface-2 disabled:opacity-40"
                  disabled={qty >= maxQty}
                  aria-label="Agregar uno"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 font-semibold transition ${
                  added ? 'bg-emerald-600 text-white' : 'bg-surface-3 text-fg hover:bg-surface-2'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-5 w-5" /> Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" /> Agregar
                  </>
                )}
              </button>

              <button
                onClick={buyNow}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700"
              >
                Comprar ahora
              </button>
            </div>
          )}

          {/* Tarjetas de entrega (diseño 04) */}
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
              <Store className="h-[18px] w-[18px] shrink-0 text-brand-500" strokeWidth={1.7} />
              <span className="text-xs text-fg-muted">
                Recoge hoy en tienda · {STORE.city.split(',')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
              <Truck className="h-[18px] w-[18px] shrink-0 text-brand-500" strokeWidth={1.7} />
              <span className="text-xs text-fg-muted">
                {STORE.freeShippingFrom
                  ? `Envío gratis desde ${formatPrice(STORE.freeShippingFrom).replace(/\.00\b/, '')} · 2–4 días`
                  : 'Envío a todo México · 2–4 días'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} onSummary={setReviewSummary} />
    </div>
  )
}
