import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Ticket,
  X,
  Truck,
  Store,
  Check,
} from 'lucide-react'
import ProductImage from '../components/ProductImage'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { formatPrice, variantLabel, STORE } from '../config'
import { findCoupon, evaluateCoupon, computeTotals, couponLabel } from '../lib/coupons'

export default function Cart() {
  const {
    items,
    subtotal,
    setQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [checking, setChecking] = useState(false)

  const { discount, freeShipping, shipping, total } = computeTotals(subtotal, appliedCoupon)
  const couponStillValid = appliedCoupon ? evaluateCoupon(appliedCoupon, subtotal).valid : true
  const missingForFree =
    !freeShipping && STORE.freeShippingFrom && subtotal > 0 && subtotal < STORE.freeShippingFrom
      ? STORE.freeShippingFrom - subtotal
      : 0

  async function handleApplyCoupon(e) {
    e.preventDefault()
    const code = couponInput.trim()
    if (!code) return
    setChecking(true)
    setCouponError('')
    try {
      const coupon = await findCoupon(code)
      if (!coupon) {
        setCouponError('Cupón no válido.')
        return
      }
      const ev = evaluateCoupon(coupon, subtotal)
      if (!ev.valid) {
        setCouponError(ev.reason)
        return
      }
      applyCoupon(coupon)
      setCouponInput('')
    } catch {
      setCouponError('No se pudo validar el cupón.')
    } finally {
      setChecking(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="sticker mx-auto grid h-16 w-16 place-items-center rounded-full">
          <ShoppingBag className="h-8 w-8 text-fg" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-fg">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 font-medium text-fg-muted">
          Explora el catálogo y agrega tus productos favoritos.
        </p>
        <Link to="/catalogo" className="btn-sticker mt-6">
          Ir al catálogo
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3.5">
        <h1 className="title-stamp text-lg sm:text-2xl">
          <span>Mi carrito</span>
        </h1>
        <span className="text-[12.5px] font-medium text-fg-subtle">
          {items.reduce((n, i) => n + i.quantity, 0)} artículo
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'}
        </span>
      </div>

      {/* Barra de entrega (amarilla, diseño 1b) */}
      {subtotal > 0 && (STORE.pickupOnly || shipping === 0) && (
        <div className="mt-5 flex items-center gap-2.5 rounded-[10px] border-2 border-ink bg-accent-400 px-4 py-3">
          {STORE.pickupOnly ? (
            <Store className="h-[17px] w-[17px] shrink-0 text-fg" strokeWidth={2} />
          ) : (
            <Truck className="h-[17px] w-[17px] shrink-0 text-fg" strokeWidth={2} />
          )}
          <span className="text-[13px] font-bold text-fg">
            {STORE.pickupOnly
              ? 'Recoge tu pedido en tienda · Sin costo de envío'
              : '¡Tienes envío gratis!'}
          </span>
        </div>
      )}

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/* Lista de productos: contenedor con borde negro, filas divididas */}
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          {items.map((item, idx) => (
            <div
              key={item.key ?? item.id}
              className={`flex gap-4 p-4 ${idx > 0 ? 'border-t-2 border-ink' : ''}`}
            >
              <Link to={`/producto/${item.id}`} className="shrink-0">
                <ProductImage
                  src={item.image_url}
                  alt={item.name}
                  className="h-[88px] w-[88px] rounded-lg border-2 border-ink"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to={`/producto/${item.id}`}
                  className="text-sm font-bold text-fg hover:text-brand-600"
                >
                  {item.name}
                </Link>
                {item.variant && (
                  <p className="mt-0.5 text-[11.5px] font-semibold text-[#4a4a4a]">
                    {variantLabel(item.variant)}
                  </p>
                )}
                <p className="mt-0.5 text-xs font-medium text-fg-subtle">
                  {formatPrice(item.price)} c/u
                </p>

                <div className="mt-auto inline-flex items-center self-start overflow-hidden rounded-lg border-2 border-ink pt-0">
                  <button
                    onClick={() => setQuantity(item.key ?? item.id, item.quantity - 1)}
                    className="grid h-8 w-8 place-items-center text-fg hover:bg-surface-2 disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    aria-label="Quitar uno"
                  >
                    <Minus className="h-[13px] w-[13px]" strokeWidth={2.5} />
                  </button>
                  <span className="grid h-8 w-[34px] place-items-center border-x-2 border-ink text-[13px] font-bold text-fg">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(item.key ?? item.id, item.quantity + 1)}
                    className="grid h-8 w-8 place-items-center text-fg hover:bg-surface-2 disabled:opacity-40"
                    disabled={item.quantity >= (item.stock ?? 99)}
                    aria-label="Agregar uno"
                  >
                    <Plus className="h-[13px] w-[13px]" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.key ?? item.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
                  aria-label="Quitar producto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="price-tag text-[15px]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen (tarjeta sticker) */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="sticker p-5">
            <h2 className="font-display text-base font-extrabold uppercase text-fg">Resumen</h2>

            {/* Cupón */}
            <div className="mt-3.5">
              {appliedCoupon && couponStillValid ? (
                /* Cupón aplicado (caja amarilla del diseño) */
                <div className="flex items-center gap-2.5 rounded-lg border-2 border-ink bg-accent-400 px-3 py-2.5">
                  <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md bg-ink">
                    <Check className="h-3 w-3 text-accent-400" strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-fg">
                      Cupón <span className="font-mono">{appliedCoupon.code}</span> aplicado
                    </p>
                    <p className="text-[11px] font-medium text-fg">{couponLabel(appliedCoupon)}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="grid h-6 w-6 place-items-center text-fg transition hover:opacity-70"
                    aria-label="Quitar cupón"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Código de cupón"
                      className="h-[46px] w-full rounded-[10px] border-2 border-dashed border-ink bg-white pl-9 pr-3 font-mono text-[13px] font-semibold uppercase tracking-[.08em] text-fg placeholder:text-fg-subtle focus:border-solid focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={checking || !couponInput.trim()}
                    className="shrink-0 rounded-[10px] bg-ink px-4 font-display text-xs font-extrabold uppercase text-white transition hover:bg-ink-2 disabled:opacity-50"
                  >
                    {checking ? <Spinner size={4} className="border-white/40 border-t-white" /> : 'Aplicar'}
                  </button>
                </form>
              )}
              {couponError && (
                <p className="mt-2 text-xs font-bold text-brand-600">{couponError}</p>
              )}
              {appliedCoupon && !couponStillValid && (
                <p className="mt-2 text-xs font-bold text-state-pending">
                  El cupón no aplica al subtotal actual.
                </p>
              )}
            </div>

            <dl className="mt-3.5 space-y-2.5 border-t-2 border-ink pt-3.5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">Subtotal</dt>
                <dd className="font-bold text-fg">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="font-semibold text-brand-600">
                    Cupón {appliedCoupon.code}
                    {appliedCoupon.type === 'percent' && ` (−${Number(appliedCoupon.value)}%)`}
                  </dt>
                  <dd className="font-bold text-brand-600">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">
                  {STORE.pickupOnly ? 'Entrega' : 'Envío'}
                </dt>
                <dd className="font-bold text-fg">
                  {STORE.pickupOnly
                    ? 'Recoge en tienda'
                    : shipping === 0
                      ? 'Gratis'
                      : formatPrice(shipping)}
                </dd>
              </div>
              {missingForFree > 0 && (
                <p className="rounded-lg border-2 border-ink bg-accent-400/40 px-3 py-2 text-xs font-medium text-fg">
                  Te faltan <b>{formatPrice(missingForFree)}</b> para envío gratis.
                </p>
              )}
              <div className="mt-1 flex items-center justify-between border-t-2 border-ink pt-3">
                <dt className="font-display text-[15px] font-extrabold uppercase text-fg">Total</dt>
                <dd>
                  <span className="price-tag px-2.5 text-[22px] font-black">
                    {formatPrice(total)}
                  </span>
                </dd>
              </div>
            </dl>

            <Link to="/checkout" className="btn-sticker mt-4 w-full">
              Proceder al pago
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              to="/catalogo"
              className="mt-3 block text-center text-[13px] font-semibold text-[#4a4a4a] hover:text-fg"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
