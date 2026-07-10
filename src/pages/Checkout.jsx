import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Lock, AlertCircle, CreditCard } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, calcShipping } from '../config'
import { createOrder } from '../lib/api'
import { createMercadoPagoPreference } from '../lib/mercadopago'
import { isSupabaseConfigured } from '../lib/supabase'

const EMPTY = { name: '', email: '', phone: '', address: '', notes: '' }

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shipping = calcShipping(subtotal)
  const total = subtotal + shipping

  // Prellena los datos si el cliente tiene sesión iniciada.
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: f.name || profile?.full_name || '',
      email: f.email || user.email || '',
      phone: f.phone || profile?.phone || '',
    }))
  }, [user, profile])

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
        userId: user?.id,
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
      window.location.href = init_point
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar el pago.')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Finalizar compra
      </h1>

      {!isSupabaseConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            <b>Modo demostración.</b> Conecta Supabase y MercadoPago para procesar pagos
            reales. Por ahora el pago se simula para mostrar el flujo.
          </p>
        </div>
      )}

      <form onSubmit={handlePay} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Datos de envío */}
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-bold text-fg">
            Datos de contacto y envío
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">
              Nombre completo
            </label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Correo electrónico
              </label>
              <input
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="juan@correo.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Teléfono / WhatsApp
              </label>
              <input
                className="field"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="722 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">
              Dirección de envío
            </label>
            <textarea
              className="field"
              rows={3}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Calle y número, colonia, ciudad, C.P."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">
              Notas (opcional)
            </label>
            <input
              className="field"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Referencias, horario de entrega, etc."
            />
          </div>
        </div>

        {/* Resumen y pago */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-fg">Tu pedido</h2>

            <ul className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-fg-muted">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="shrink-0 font-medium text-fg">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
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
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-semibold text-fg">Total</dt>
                <dd className="font-display text-xl font-bold text-brand-500">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-600/15 p-3 text-sm text-brand-300">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
              {loading ? (
                <Spinner size={5} className="border-white/40 border-t-white" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pagar {formatPrice(total)}
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
              <Lock className="h-3.5 w-3.5" />
              Pago protegido con MercadoPago
            </p>
          </div>
          <Link
            to="/carrito"
            className="mt-3 block text-center text-sm font-medium text-fg-muted hover:text-brand-400"
          >
            Volver al carrito
          </Link>
        </aside>
      </form>
    </div>
  )
}
