import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ChevronLeft, Check, Package, Truck, Home, Store as StoreIcon, XCircle } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getOrderById } from '../../lib/api'
import { formatPrice, orderNumber, STORE } from '../../config'

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.53 15.28L2 22l4.85-1.42A10 10 0 1 0 12 2z" />
    </svg>
  )
}

function fmtDateTime(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// Pasos del pedido; se paga en la tienda al recoger (sin pago en línea).
function stepsFor(deliveryMethod) {
  return [
    { label: 'Pedido confirmado', icon: Check, note: 'Recibimos tu pedido' },
    { label: 'En preparación', icon: Package, note: 'Armando tu pedido' },
    deliveryMethod === 'pickup'
      ? { label: 'Listo para recoger', icon: StoreIcon, note: 'Te esperamos en tienda · pagas al recoger' }
      : { label: 'Enviado', icon: Truck, note: 'En camino' },
    { label: 'Entregado', icon: Home, note: 'Recibido' },
  ]
}
// 'paid' se cobra en mostrador al recoger, así que equivale a "listo para recoger".
const STATUS_STEP = { pending: 0, paid: 2, processing: 1, shipped: 2, delivered: 3 }

export default function OrderTracking() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getOrderById(id)
      .then((o) => (o ? setOrder(o) : setNotFound(true)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, user])

  if (authLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/cuenta/login" replace />

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-fg">Pedido no encontrado</h1>
        <Link to="/cuenta" className="mt-4 inline-block text-brand-400 hover:underline">
          Volver a mi cuenta
        </Link>
      </div>
    )
  }

  const cancelled = order.status === 'cancelled'
  const current = STATUS_STEP[order.status] ?? 0
  const waLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    `Hola, quiero consultar mi pedido ${orderNumber(order)}`
  )}`

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        to="/cuenta"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#4a4a4a] hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        Mi cuenta
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="title-stamp text-lg sm:text-xl">
          <span>Seguimiento</span>
        </h1>
        <span className="font-mono text-[13px] font-bold text-fg-subtle">
          {orderNumber(order)}
        </span>
      </div>

      {/* Método de entrega (diseño 1b: icono en cuadro amarillo) */}
      <div className="mt-5 flex items-center gap-3 rounded-[10px] border-2 border-ink bg-white px-4 py-3.5">
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
          {order.delivery_method === 'pickup' ? (
            <Home className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <Truck className="h-5 w-5" strokeWidth={1.8} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-fg">
            {order.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Entrega estimada'}
          </p>
          <p className="text-xs font-medium text-fg-subtle">
            {order.delivery_method === 'pickup' ? STORE.branch : '2–4 días hábiles'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Timeline (póster 1b: hechos negros con check amarillo, actual rojo) */}
      {cancelled ? (
        <div className="mt-5 flex items-center gap-3 rounded-[10px] border-2 border-ink bg-brand-600 p-4 text-white">
          <XCircle className="h-6 w-6" />
          <p className="text-sm font-bold">Este pedido fue cancelado.</p>
        </div>
      ) : (
        <div className="mt-6 pl-1">
          {stepsFor(order.delivery_method).map((step, i, steps) => {
            const isCurrent = i === current && order.status !== 'delivered'
            const done = i < current || (i === current && order.status === 'delivered')
            const last = i === steps.length - 1
            return (
              <div key={step.label} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  {done ? (
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-ink">
                      <Check className="h-[11px] w-[11px] text-accent-400" strokeWidth={3.5} />
                    </span>
                  ) : isCurrent ? (
                    <span className="h-[22px] w-[22px] shrink-0 rounded-full border-2 border-ink bg-brand-600 shadow-[0_0_0_4px_rgba(255,0,0,.18)]" />
                  ) : (
                    <span className="h-[22px] w-[22px] shrink-0 rounded-full border-2 border-fg-subtle bg-white" />
                  )}
                  {!last && (
                    <span
                      className={`w-[3px] flex-1 ${done ? 'bg-ink' : 'bg-[#d9d9d9]'}`}
                      style={{ minHeight: '26px' }}
                    />
                  )}
                </div>
                <div className="pb-[18px]">
                  <p
                    className={`text-[13.5px] font-bold leading-[22px] ${
                      done || isCurrent ? 'text-fg' : 'text-fg-subtle'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[11.5px] ${
                      isCurrent
                        ? 'font-bold text-brand-600'
                        : done
                          ? 'font-medium text-fg-subtle'
                          : 'font-medium text-[#b0b0b0]'
                    }`}
                  >
                    {isCurrent ? `Ahora · ${step.note.toLowerCase()}` : done ? step.note : 'Pendiente'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resumen breve */}
      <div className="mt-2 flex items-center justify-between rounded-[10px] border-2 border-ink bg-white px-4 py-3.5 text-[12.5px]">
        <span className="font-medium text-[#4a4a4a]">
          {order.order_items?.reduce((n, i) => n + i.quantity, 0)} artículo(s) ·{' '}
          {fmtDateTime(order.created_at)}
        </span>
        <span className="price-tag text-base">{formatPrice(order.total)}</span>
      </div>

      {/* WhatsApp (botón negro con icono amarillo) */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-ink font-display text-[12.5px] font-extrabold uppercase tracking-[.06em] text-white transition hover:bg-ink-2"
      >
        <WhatsAppIcon className="h-4 w-4 text-accent-400" />
        Contactar por WhatsApp
      </a>
    </div>
  )
}
