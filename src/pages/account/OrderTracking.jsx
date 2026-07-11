import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ChevronLeft, Check, Package, Truck, Home, CreditCard, XCircle } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getOrderById } from '../../lib/api'
import { formatPrice, STORE } from '../../config'

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

const STEPS = [
  { label: 'Pedido confirmado', icon: Check, note: 'Recibimos tu pedido' },
  { label: 'Pago aprobado', icon: CreditCard, note: 'MercadoPago' },
  { label: 'En preparación', icon: Package, note: 'Armando tu pedido' },
  { label: 'Enviado', icon: Truck, note: 'En camino' },
  { label: 'Entregado', icon: Home, note: 'Recibido' },
]
const STATUS_STEP = { pending: 0, paid: 1, processing: 2, shipped: 3, delivered: 4 }

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
    `Hola, quiero consultar mi pedido #${order.id.slice(0, 8).toUpperCase()}`
  )}`

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        to="/cuenta"
        className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        Mi cuenta
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">Seguimiento</h1>
        <span className="font-mono text-sm text-fg-subtle">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Entrega estimada (diseño 09: icono azul de información) */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-blue-400/15 text-blue-400">
          {order.delivery_method === 'pickup' ? (
            <Home className="h-[21px] w-[21px]" strokeWidth={1.7} />
          ) : (
            <Truck className="h-[21px] w-[21px]" strokeWidth={1.7} />
          )}
        </span>
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-fg">
            {order.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Entrega estimada'}
          </p>
          <p className="text-xs text-fg-muted">
            {order.delivery_method === 'pickup' ? STORE.city : '2–4 días hábiles'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      {cancelled ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand-600/30 bg-brand-600/10 p-4">
          <XCircle className="h-6 w-6 text-brand-500" />
          <p className="text-sm font-semibold text-fg">Este pedido fue cancelado.</p>
        </div>
      ) : (
        <div className="mt-6 pl-1">
          {STEPS.map((step, i) => {
            const isCurrent = i === current && order.status !== 'delivered'
            const done = i < current || (i === current && order.status === 'delivered')
            const last = i === STEPS.length - 1
            return (
              <div key={step.label} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  {/* Círculo del paso (diseño 09): verde=hecho, rojo con halo=actual, gris=pendiente */}
                  {done ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400 text-ink">
                      <Check className="h-[11px] w-[11px]" strokeWidth={3.2} />
                    </span>
                  ) : isCurrent ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-[0_0_0_4px_rgba(220,38,38,.2)]">
                      <Check className="h-[11px] w-[11px]" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-[#3f3f46] bg-surface-2" />
                  )}
                  {!last && (
                    <span
                      className={`w-0.5 flex-1 ${done ? 'bg-emerald-400' : 'bg-[#3f3f46]'}`}
                      style={{ minHeight: '30px' }}
                    />
                  )}
                </div>
                <div className="pb-5">
                  <p
                    className={`text-sm font-semibold leading-5 ${
                      done || isCurrent ? 'text-fg' : 'text-fg-subtle'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[11.5px] ${
                      isCurrent ? 'text-brand-400' : done ? 'text-fg-subtle' : 'text-[#52525b]'
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
      <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">
            {order.order_items?.reduce((n, i) => n + i.quantity, 0)} artículo(s) ·{' '}
            {fmtDateTime(order.created_at)}
          </span>
          <span className="font-display text-lg font-bold text-brand-500">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* WhatsApp (diseño 09: botón oscuro) */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-3 text-sm font-semibold text-fg transition hover:bg-surface-2"
      >
        <WhatsAppIcon className="h-[17px] w-[17px]" />
        Contactar por WhatsApp
      </a>
    </div>
  )
}
