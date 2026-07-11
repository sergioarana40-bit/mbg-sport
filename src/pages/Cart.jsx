import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Ticket, X, Truck, Check } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { formatPrice, STORE } from '../config'
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
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-2">
          <ShoppingBag className="h-8 w-8 text-fg-subtle" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-fg">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-fg-muted">
          Explora el catálogo y agrega tus productos favoritos.
        </p>
        <Link to="/catalogo" className="btn-primary mt-6">
          Ir al catálogo
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Mi carrito
        </h1>
        <span className="text-[12.5px] text-fg-subtle">
          {items.reduce((n, i) => n + i.quantity, 0)} artículo
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'}
        </span>
      </div>

      {/* Banner de envío gratis (diseño 05) */}
      {shipping === 0 && subtotal > 0 && (
        <div className="mb-5 flex items-center gap-2.5 rounded-[11px] bg-emerald-400/10 px-3.5 py-3">
          <Truck className="h-[17px] w-[17px] shrink-0 text-emerald-400" strokeWidth={1.8} />
          <span className="text-[12.5px] font-medium text-emerald-200">
            ¡Tienes envío gratis!
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Lista de productos */}
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <Link to={`/producto/${item.id}`} className="shrink-0">
                <ProductImage
                  src={item.image_url}
                  alt={item.name}
                  className="h-24 w-24 rounded-lg border border-line"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    to={`/producto/${item.id}`}
                    className="font-semibold text-fg hover:text-brand-400"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-subtle transition hover:bg-brand-600/15 hover:text-brand-400"
                    aria-label="Quitar producto"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
                <p className="text-sm text-fg-muted">{formatPrice(item.price)} c/u</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-xl border border-line">
                    <button
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className="grid h-9 w-9 place-items-center text-fg-muted hover:bg-surface-2 disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold text-fg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className="grid h-9 w-9 place-items-center text-fg-muted hover:bg-surface-2 disabled:opacity-40"
                      disabled={item.quantity >= (item.stock ?? 99)}
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-display text-lg font-bold text-fg">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-fg">Resumen</h2>

            {/* Cupón */}
            <div className="mt-4">
              {appliedCoupon && couponStillValid ? (
                /* Cupón aplicado (diseño 07) */
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-3">
                  <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-emerald-400 text-ink">
                    <Check className="h-[15px] w-[15px]" strokeWidth={3} />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-emerald-100">
                      Cupón <span className="font-mono">{appliedCoupon.code}</span> aplicado
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      {couponLabel(appliedCoupon)}
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="grid h-6 w-6 place-items-center rounded text-emerald-300 transition hover:text-emerald-100"
                    aria-label="Quitar cupón"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Código de cupón"
                      className="field pl-9 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={checking || !couponInput.trim()}
                    className="shrink-0 rounded-xl bg-surface-3 px-4 text-sm font-semibold text-fg transition hover:bg-surface-2 disabled:opacity-50"
                  >
                    {checking ? <Spinner size={4} /> : 'Aplicar'}
                  </button>
                </form>
              )}
              {couponError && <p className="mt-2 text-xs text-brand-400">{couponError}</p>}
              {appliedCoupon && !couponStillValid && (
                <p className="mt-2 text-xs text-amber-400">
                  El cupón no aplica al subtotal actual.
                </p>
              )}
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Subtotal</dt>
                <dd className="font-medium text-fg">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-emerald-400">
                    Cupón {appliedCoupon.code}
                    {appliedCoupon.type === 'percent' && ` (−${Number(appliedCoupon.value)}%)`}
                  </dt>
                  <dd className="font-semibold text-emerald-400">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-fg-muted">Envío</dt>
                <dd className="font-medium text-fg">
                  {shipping === 0 ? (
                    <span className="text-emerald-400">Gratis</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </dd>
              </div>
              {missingForFree > 0 && (
                <p className="rounded-lg bg-accent-400/10 px-3 py-2 text-xs text-fg-muted">
                  Te faltan <b className="text-accent-400">{formatPrice(missingForFree)}</b> para
                  envío gratis.
                </p>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold text-fg">Total</dt>
                <dd className="font-display text-xl font-bold text-brand-500">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            <Link to="/checkout" className="btn-primary mt-5 w-full">
              Proceder al pago
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              to="/catalogo"
              className="mt-2 block text-center text-sm font-medium text-fg-muted hover:text-brand-400"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
