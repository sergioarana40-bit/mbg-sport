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
        <h1 className="font-display text-2xl font-extrabold text-fg">Producto no encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block font-bold text-brand-600 hover:underline">
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
      <nav className="mb-6 flex items-center gap-1.5 text-[12.5px] font-medium text-fg-subtle">
        <Link to="/tienda" className="hover:text-brand-600">
          Inicio
        </Link>
        <ChevronRight className="h-[13px] w-[13px]" />
        <Link to="/catalogo" className="hover:text-brand-600">
          Catálogo
        </Link>
        <ChevronRight className="h-[13px] w-[13px]" />
        <span className="truncate font-semibold text-fg">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-11">
        <div className="relative">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="aspect-square rounded-[10px] border-2 border-ink shadow-hard"
          />
          {product.featured && (
            <span className="badge-featured absolute left-3 top-3">Destacado</span>
          )}
          <FavoriteButton
            productId={product.id}
            className="absolute right-3 top-3 h-[38px] w-[38px] rounded-lg border-2 border-ink bg-white text-fg"
          />
        </div>

        <div>
          {product.category_name && (
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-fg-subtle">
              {product.category_name}
            </span>
          )}
          <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none text-fg lg:text-4xl">
            {product.name}
          </h1>

          {/* Calificación: estrellas amarillas con contorno negro */}
          <a href="#resenas" className="mt-3 inline-flex items-center gap-2 hover:opacity-80">
            <StarRating value={reviewSummary?.avg ?? 0} size={4.25} />
            <span className="text-[12.5px] font-semibold text-[#4a4a4a]">
              {reviewSummary?.count
                ? `${reviewSummary.avg.toFixed(1)} · ${reviewSummary.count} reseña${
                    reviewSummary.count === 1 ? '' : 's'
                  }`
                : 'Sé el primero en reseñar'}
            </span>
          </a>

          <p className="mt-4">
            <span className="price-tag px-3 py-1 text-2xl font-black lg:text-3xl">
              {formatPrice(product.price)}
            </span>
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-[13px]">
            {outOfStock ? (
              <span className="badge-out">Agotado</span>
            ) : (
              <>
                <Check className="h-[15px] w-[15px] text-fg" strokeWidth={3} />
                <span className="font-bold text-fg">{product.stock} disponibles</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-4 max-w-[480px] text-[14.5px] font-medium leading-relaxed text-[#4a4a4a]">
              {product.description}
            </p>
          )}

          {/* Cantidad + acciones (póster 1b) */}
          {!outOfStock && (
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <div className="flex items-center overflow-hidden rounded-[10px] border-2 border-ink">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-11 w-11 place-items-center text-fg hover:bg-surface-2 disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <span className="grid h-11 w-11 place-items-center border-x-2 border-ink text-[15px] font-bold text-fg">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="grid h-11 w-11 place-items-center text-fg hover:bg-surface-2 disabled:opacity-40"
                  disabled={qty >= maxQty}
                  aria-label="Agregar uno"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`inline-flex h-12 items-center gap-2.5 rounded-[10px] px-6 font-display text-[13px] font-extrabold uppercase tracking-[.08em] text-white transition ${
                  added ? 'bg-state-paid' : 'bg-ink hover:bg-ink-2'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-[17px] w-[17px]" /> Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-[17px] w-[17px]" /> Agregar
                  </>
                )}
              </button>

              <button onClick={buyNow} className="btn-sticker h-12">
                Comprar ahora
              </button>
            </div>
          )}

          {/* Barra de recogida en tienda (amarilla, diseño 1b) */}
          <div className="mt-5 flex max-w-[430px] items-center gap-2.5 rounded-[10px] border-2 border-ink bg-accent-400 px-4 py-3">
            <Store className="h-[18px] w-[18px] shrink-0 text-fg" strokeWidth={2} />
            <span className="text-[12.5px] font-semibold text-fg">
              Recoge tu pedido en tienda · {STORE.city.split(',')[0]} · Listo hoy
            </span>
          </div>
          {!STORE.pickupOnly && (
            <div className="mt-2.5 flex max-w-[430px] items-center gap-2.5 rounded-[10px] border-2 border-ink bg-white px-4 py-3">
              <Truck className="h-[18px] w-[18px] shrink-0 text-fg" strokeWidth={2} />
              <span className="text-[12.5px] font-semibold text-fg">
                {STORE.freeShippingFrom
                  ? `Envío gratis desde ${formatPrice(STORE.freeShippingFrom).replace(/\.00\b/, '')} · 2–4 días`
                  : 'Envío a domicilio · 2–4 días'}
              </span>
            </div>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} onSummary={setReviewSummary} />
    </div>
  )
}
