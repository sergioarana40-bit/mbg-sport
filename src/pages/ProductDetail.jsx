import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Check, ChevronRight, Store, Truck } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import FavoriteButton from '../components/FavoriteButton'
import ProductReviews from '../components/ProductReviews'
import StarRating from '../components/StarRating'
import Spinner from '../components/Spinner'
import { getProductById } from '../lib/api'
import { formatPrice, hasPrice, STORE } from '../config'
import { useCart } from '../context/CartContext'

function WhatsAppIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.53 15.28L2 22l4.85-1.42A10 10 0 1 0 12 2z" />
    </svg>
  )
}

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

  const noPrice = !hasPrice(product.price)
  const outOfStock = product.stock === 0
  const maxQty = Math.min(product.stock ?? 99, 99)
  // Consulta de precio por WhatsApp para productos publicados sin precio.
  const priceWaLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    `Hola, quiero consultar el precio de: ${product.name}`
  )}`

  function handleAdd() {
    if (noPrice) return
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  function buyNow() {
    if (noPrice) return
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
            {noPrice ? (
              <span className="inline-block rounded-lg border-2 border-ink bg-accent-400 px-3 py-1.5 font-display text-sm font-extrabold uppercase text-fg lg:text-base">
                Precio por confirmar
              </span>
            ) : (
              <span className="price-tag px-3 py-1 text-2xl font-black lg:text-3xl">
                {formatPrice(product.price)}
              </span>
            )}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-[13px]">
            {outOfStock ? (
              noPrice ? null : <span className="badge-out">Agotado</span>
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

          {/* Sin precio: se consulta por WhatsApp (no hay carrito) */}
          {noPrice && (
            <div className="mt-6">
              <a
                href={priceWaLink}
                target="_blank"
                rel="noreferrer"
                className="btn-sticker-yellow h-12"
              >
                <WhatsAppIcon className="h-[17px] w-[17px]" />
                Consultar precio
              </a>
              <p className="mt-2.5 max-w-[430px] text-[12.5px] font-medium text-fg-subtle">
                Este artículo aún no tiene precio publicado. Escríbenos y te lo confirmamos
                al momento.
              </p>
            </div>
          )}

          {/* Cantidad + acciones (póster 1b) */}
          {!outOfStock && !noPrice && (
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
