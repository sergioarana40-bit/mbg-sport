import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Lock, AlertCircle, CreditCard, Truck, Store } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, STORE } from '../config'
import { computeTotals } from '../lib/coupons'
import { createOrder } from '../lib/api'
import { createMercadoPagoPreference } from '../lib/mercadopago'
import { isSupabaseConfigured } from '../lib/supabase'

const EMPTY = { name: '', email: '', phone: '', address: '', notes: '' }

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, appliedCoupon, clearCart } = useCart()
  const { user, profile } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [delivery, setDelivery] = useState('shipping') // 'shipping' | 'pickup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const base = computeTotals(subtotal, appliedCoupon)
  const discount = base.discount
  const shipping = delivery === 'pickup' ? 0 : base.shipping
  const total = Math.max(0, subtotal - discount + shipping)

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
    if (delivery === 'shipping' && !form.address.trim())
      return 'Escribe tu dirección de envío.'
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
        address:
          delivery === 'pickup' ? `Recoge en tienda — ${STORE.address}` : form.address.trim(),
      }
      const order = await createOrder({
        customer,
        items,
        subtotal,
        shipping,
        discount,
        couponCode: appliedCoupon?.code || null,
        deliveryMethod: delivery,
        total,
        notes: form.notes.trim(),
        userId: user?.id,
      })
      const { init_point } = await createMercadoPagoPreference({
        order: {
          id: order.id,
          shipping,
          discount,
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

  const deliveryOption = (value, Icon, title, subtitle) => {
    const active = delivery === value
    return (
      <button
        type="button"
        onClick={() => setDelivery(value)}
        className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
          active ? 'border-brand-500 bg-brand-600/10' : 'border-line bg-surface-2 hover:bg-surface-3'
        }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
            active ? 'bg-brand-600 text-white' : 'bg-surface-3 text-fg-muted'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-fg">{title}</span>
          <span className="block text-xs text-fg-muted">{subtitle}</span>
        </span>
        <span
          className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
            active ? 'border-brand-500' : 'border-surface-3'
          }`}
        >
          {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
        </span>
      </button>
    )
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
            <b>Modo demostración.</b> Conecta Supabase y MercadoPago para procesar pagos reales.
          </p>
        </div>
      )}

      <form onSubmit={handlePay} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Entrega */}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-fg">¿Cómo quieres recibirlo?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {deliveryOption('shipping', Truck, 'Envío a domicilio', '2–4 días · gratis desde $1,500')}
              {deliveryOption('pickup', Store, 'Recogida en tienda', 'Toluca · gratis')}
            </div>
            {delivery === 'pickup' && (
              <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-fg-muted">
                Recoge en: {STORE.address}
              </p>
            )}
          </div>

          {/* Datos */}
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-fg">Datos de contacto</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Nombre completo</label>
              <input
                className="field"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-fg-muted">Correo</label>
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
            {delivery === 'shipping' && (
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
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Notas (opcional)</label>
              <input
                className="field"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Referencias, horario, etc."
              />
            </div>
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
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Descuento {appliedCoupon ? `(${appliedCoupon.code})` : ''}</dt>
                  <dd className="font-medium text-emerald-400">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-fg-muted">{delivery === 'pickup' ? 'Recogida' : 'Envío'}</dt>
                <dd className="font-medium text-fg">
                  {shipping === 0 ? <span className="text-emerald-400">Gratis</span> : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-semibold text-fg">Total</dt>
                <dd className="font-display text-xl font-bold text-brand-500">{formatPrice(total)}</dd>
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
