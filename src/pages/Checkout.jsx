import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { AlertCircle, CreditCard } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, STORE } from '../config'
import { computeTotals } from '../lib/coupons'
import { createOrder } from '../lib/api'
import { createMercadoPagoPreference } from '../lib/mercadopago'
import { isSupabaseConfigured } from '../lib/supabase'

const EMPTY = { name: '', email: '', phone: '', address: '', notes: '' }

// Radio del póster: círculo blanco con borde negro y punto rojo al estar activo.
function PosterRadio({ active, dimmed = false }) {
  return (
    <span
      className={`relative inline-block h-5 w-5 shrink-0 rounded-full border-2 bg-white ${
        dimmed ? 'border-fg-subtle' : 'border-ink'
      }`}
    >
      {active && <span className="absolute inset-[3px] rounded-full bg-brand-600" />}
    </span>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, appliedCoupon, clearCart } = useCart()
  const { user, profile } = useAuth()
  const [form, setForm] = useState(EMPTY)
  // 'shipping' | 'pickup' — con pickupOnly solo se ofrece recoger en tienda.
  const [delivery, setDelivery] = useState(STORE.pickupOnly ? 'pickup' : 'shipping')
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

  // Etiqueta de campo (mayúsculas pequeñas del póster).
  const label = (text) => (
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
      {text}
    </p>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Título + stepper (diseño 1b) */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="title-stamp text-lg sm:text-2xl">
          <span>Checkout</span>
        </h1>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.06em]">
          <Link to="/carrito" className="text-fg-subtle transition hover:text-fg">
            1 · Carrito
          </Link>
          <span className="text-fg-subtle">→</span>
          <span className="rounded-full border-2 border-ink bg-accent-400 px-2.5 py-1 text-fg">
            2 · Datos y pago
          </span>
          <span className="text-fg-subtle">→</span>
          <span className="text-fg-subtle">3 · Confirmación</span>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mt-6 flex items-start gap-3 rounded-[10px] border-2 border-ink bg-accent-400/40 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            <b>Modo demostración.</b> Conecta Supabase y MercadoPago para procesar pagos reales.
          </p>
        </div>
      )}

      <form onSubmit={handlePay} className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Datos de contacto */}
          <div className="rounded-[10px] border-2 border-ink bg-white p-5 sm:p-6">
            <h2 className="font-display text-[15px] font-extrabold uppercase text-fg">
              Datos de contacto
            </h2>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div>
                {label('Nombre completo')}
                <input
                  className="field"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                {label('Teléfono / WhatsApp')}
                <input
                  className="field"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="722 123 4567"
                />
              </div>
            </div>
            <div className="mt-3.5">
              {label('Correo electrónico')}
              <input
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
            <div className="mt-3.5">
              {label('Notas (opcional)')}
              <input
                className="field"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Referencias, horario, etc."
              />
            </div>
          </div>

          {/* Entrega */}
          <div className="rounded-[10px] border-2 border-ink bg-white p-5 sm:p-6">
            <h2 className="font-display text-[15px] font-extrabold uppercase text-fg">Entrega</h2>
            <div className="mt-4 flex flex-col gap-3">
              {/* Recoger en tienda (seleccionada, amarilla) */}
              <button
                type="button"
                onClick={() => setDelivery('pickup')}
                className={`flex items-center gap-3.5 rounded-[10px] border-2 px-4 py-3.5 text-left transition ${
                  delivery === 'pickup'
                    ? 'border-ink bg-accent-400'
                    : 'border-ink bg-white hover:bg-surface-2'
                }`}
              >
                <PosterRadio active={delivery === 'pickup'} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-fg">Recoger en tienda</span>
                  <span className="mt-0.5 block text-xs font-medium text-[#4a4a4a]">
                    {STORE.address.split(',').slice(0, 2).join(',')} · Listo hoy
                  </span>
                </span>
                <span className="font-display text-[11px] font-extrabold uppercase text-fg">
                  Gratis
                </span>
              </button>

              {/* Envío a domicilio */}
              {STORE.pickupOnly ? (
                <div className="flex items-center gap-3.5 rounded-[10px] border-2 border-dashed border-fg-subtle px-4 py-3.5 text-fg-subtle">
                  <PosterRadio active={false} dimmed />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold">Envío a domicilio</span>
                    <span className="mt-0.5 block text-xs font-medium">Próximamente</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDelivery('shipping')}
                  className={`flex items-center gap-3.5 rounded-[10px] border-2 px-4 py-3.5 text-left transition ${
                    delivery === 'shipping'
                      ? 'border-ink bg-accent-400'
                      : 'border-ink bg-white hover:bg-surface-2'
                  }`}
                >
                  <PosterRadio active={delivery === 'shipping'} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold text-fg">Envío a domicilio</span>
                    <span className="mt-0.5 block text-xs font-medium text-[#4a4a4a]">
                      2–4 días hábiles
                    </span>
                  </span>
                  <span className="font-display text-[11px] font-extrabold uppercase text-fg">
                    {base.shipping === 0 ? 'Gratis' : formatPrice(STORE.shippingCost)}
                  </span>
                </button>
              )}

              {delivery === 'pickup' && STORE.maps && (
                <a
                  href={STORE.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-[12.5px] font-bold text-brand-600 underline underline-offset-2 transition hover:text-brand-700"
                >
                  Cómo llegar a la tienda (Google Maps)
                </a>
              )}

              {delivery === 'shipping' && !STORE.pickupOnly && (
                <div>
                  {label('Dirección de envío')}
                  <textarea
                    className="field"
                    rows={3}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Calle y número, colonia, ciudad, C.P."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pago */}
          <div className="rounded-[10px] border-2 border-ink bg-white p-5 sm:p-6">
            <h2 className="font-display text-[15px] font-extrabold uppercase text-fg">Pago</h2>
            <div className="mt-4 flex items-center gap-3.5 rounded-[10px] border-2 border-ink p-4">
              <CreditCard className="h-6 w-6 shrink-0 text-fg" strokeWidth={1.8} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-fg">MercadoPago</span>
                <span className="mt-0.5 block text-xs font-medium text-[#4a4a4a]">
                  Tarjetas, transferencia y meses sin intereses. Serás redirigido para pagar.
                </span>
              </span>
              <span className="hidden shrink-0 rounded-md border-2 border-ink bg-accent-400 px-2 py-1 font-display text-[10px] font-extrabold uppercase text-fg sm:inline-block">
                Pago seguro
              </span>
            </div>
          </div>
        </div>

        {/* Resumen y pago */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="sticker p-5">
            <h2 className="font-display text-base font-extrabold uppercase text-fg">Tu pedido</h2>

            <ul className="mt-3.5 space-y-2.5 text-[13px]">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="font-semibold text-fg">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-bold text-fg">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-3.5 space-y-2.5 border-t-2 border-ink pt-3.5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">Subtotal</dt>
                <dd className="font-bold text-fg">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="font-semibold text-brand-600">
                    Cupón {appliedCoupon ? appliedCoupon.code : ''}
                    {appliedCoupon?.type === 'percent' && ` (−${Number(appliedCoupon.value)}%)`}
                  </dt>
                  <dd className="font-bold text-brand-600">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">Entrega</dt>
                <dd className="font-bold text-fg">
                  {delivery === 'pickup'
                    ? 'Recoge en tienda'
                    : shipping === 0
                      ? 'Gratis'
                      : formatPrice(shipping)}
                </dd>
              </div>
              <div className="mt-1 flex items-center justify-between border-t-2 border-ink pt-3">
                <dt className="font-display text-[15px] font-extrabold uppercase text-fg">Total</dt>
                <dd>
                  <span className="price-tag px-2.5 text-[22px] font-black">
                    {formatPrice(total)}
                  </span>
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-sticker mt-4 h-[50px] w-full">
              {loading ? (
                <Spinner size={5} className="border-white/40 border-t-white" />
              ) : (
                'Pagar con MercadoPago'
              )}
            </button>

            <p className="mt-3 text-center text-[11px] font-medium text-fg-subtle">
              Pago procesado por MercadoPago · datos protegidos
            </p>
            <p className="mt-1.5 text-center text-[11px] font-medium leading-relaxed text-fg-subtle">
              Al pagar aceptas nuestros{' '}
              <Link to="/terminos" className="underline underline-offset-2 transition hover:text-fg">
                términos y condiciones
              </Link>
              .
            </p>
          </div>
          <Link
            to="/carrito"
            className="mt-3 block text-center text-[13px] font-semibold text-[#4a4a4a] transition hover:text-fg"
          >
            Volver al carrito
          </Link>
        </aside>
      </form>
    </div>
  )
}
