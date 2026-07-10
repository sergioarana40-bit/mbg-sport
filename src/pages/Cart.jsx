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
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral-100">
          <ShoppingBag className="h-8 w-8 text-neutral-400" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-neutral-500">
          Explora el catálogo y agrega tus productos favoritos.
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Ir al catálogo
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-tight text-neutral-900 sm:text-3xl">
        Mi carrito
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Lista de productos */}
        <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <Link to={`/producto/${item.id}`} className="shrink-0">
                <ProductImage
                  src={item.image_url}
                  alt={item.name}
                  className="h-24 w-24 rounded-lg border border-neutral-200"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    to={`/producto/${item.id}`}
                    className="font-semibold text-neutral-900 hover:text-brand-700"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-brand-600"
                    aria-label="Quitar producto"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
                <p className="text-sm text-neutral-500">{formatPrice(item.price)} c/u</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-neutral-300">
                    <button
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className="grid h-9 w-9 place-items-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className="grid h-9 w-9 place-items-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                      disabled={item.quantity >= (item.stock ?? 99)}
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-display text-lg font-bold text-neutral-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-neutral-900">Resumen</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Envío</dt>
                <dd className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-600">Gratis</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </dd>
              </div>
              {missingForFree > 0 && (
                <p className="rounded-lg bg-accent-400/15 px-3 py-2 text-xs text-neutral-700">
                  Te faltan <b>{formatPrice(missingForFree)}</b> para envío gratis.
                </p>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold text-brand-600">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            <Link
              to="/checkout"
              className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Proceder al pago
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              to="/catalogo"
              className="mt-2 block text-center text-sm font-medium text-neutral-500 hover:text-brand-600"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
