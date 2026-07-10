import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Lock, AlertCircle, CreditCard } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { formatPrice, calcShipping } from '../config'
import { createOrder } from '../lib/api'
import { createMercadoPagoPreference } from '../lib/mercadopago'
import { isSupabaseConfigured } from '../lib/supabase'

const EMPTY = { name: '', email: '', phone: '', address: '', notes: '' }

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shipping = calcShipping(subtotal)
  const total = subtotal + shipping

  // Si no hay items, regresa al carrito.
  if (items.length === 0) return <Navigate to="/carrito" replace />

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    if (!form.name.trim()) return 'Escribe tu nombre completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Escribe un correo válido.'
    if (form.phone.replace(/\D/g, '').length < 10) return 'Escribe un teléfono de 10 dígitos.'
    if (!form.address.trim()) return 'Escribe tu dirección de envío.'
    return ''
  }

  async function handlePay(e) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')

    // Modo demo (sin backend): simula el pedido para poder ver el flujo completo.
    if (!isSupabaseConfigured) {
      clearCart()
      navigate('/pedido/demo?status=demo')
      return
    }

    setLoading(true)
    try {
      const customer = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      }
      const order = await createOrder({
        customer,
        items,
        subtotal,
        shipping,
        total,
        notes: form.notes.trim(),
      })
      const { init_point } = await createMercadoPagoPreference({
        order: {
          id: order.id,
          shipping,
          customer_name: customer.name,
          customer_email: customer.email,
        },
        items,
      })
      // Redirige al checkout de MercadoPago. El carrito se limpia al confirmar el pago.
      window.location.href = init_point
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar el pago.')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-tight text-neutral-900 sm:text-3xl">
        Finalizar compra
      </h1>

      {!isSupabaseConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            <b>Modo demostración.</b> Conecta Supabase y MercadoPago para procesar pagos
            reales. Por ahora el pago se simula para mostrar el flujo.
          </p>
        </div>
      )}

      <form onSubmit={handlePay} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Datos de envío */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-neutral-900">
            Datos de contacto y envío
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre completo
            </label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Correo electrónico
              </label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="juan@correo.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Teléfono / WhatsApp
              </label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="722 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Dirección de envío
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Calle y número, colonia, ciudad, C.P."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Notas (opcional)
            </label>
            <input
              className={inputClass}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Referencias, horario de entrega, etc."
            />
          </div>
        </div>

        {/* Resumen y pago */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-neutral-900">Tu pedido</h2>

            <ul className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-neutral-600">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
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
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold text-brand-600">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-brand-700">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
            >
              {loading ? (
                <Spinner size={5} className="border-white/40 border-t-white" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pagar {formatPrice(total)}
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Lock className="h-3.5 w-3.5" />
              Pago protegido con MercadoPago
            </p>
          </div>
          <Link
            to="/carrito"
            className="mt-3 block text-center text-sm font-medium text-neutral-500 hover:text-brand-600"
          >
            Volver al carrito
          </Link>
        </aside>
      </form>
    </div>
  )
}
