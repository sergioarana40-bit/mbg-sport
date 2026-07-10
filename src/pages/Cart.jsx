import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import { useCart } from '../context/CartContext'
import { formatPrice, calcShipping, STORE } from '../config'

export default function Cart() {
  const { items, subtotal, setQuantity, removeItem } = useCart()
  const shipping = calcShipping(subtotal)
  const total = subtotal + shipping
  const missingForFree =
    STORE.freeShippingFrom && subtotal > 0 && subtotal < STORE.freeShippingFrom
      ? STORE.freeShippingFrom - subtotal
      : 0

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
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Mi carrito
      </h1>

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
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Subtotal</dt>
                <dd className="font-medium text-fg">{formatPrice(subtotal)}</dd>
              </div>
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
