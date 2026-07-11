import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, ArrowRight, Truck, Store, Download } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { getOrderById } from '../lib/api'
import { formatPrice, STORE } from '../config'
import { isSupabaseConfigured } from '../lib/supabase'

function resolveStatus(raw) {
  if (raw === 'demo') return 'demo'
  if (['approved', 'success'].includes(raw)) return 'success'
  if (['pending', 'in_process'].includes(raw)) return 'pending'
  if (['failure', 'rejected', 'cancelled', 'null'].includes(raw)) return 'failure'
  return 'success'
}

const VIEWS = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    title: '¡Gracias por tu compra!',
    text: 'Recibimos tu pago. Te contactaremos para coordinar la entrega.',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    title: 'Pago pendiente',
    text: 'Tu pago está en proceso. Te avisaremos cuando se confirme.',
  },
  failure: {
    icon: XCircle,
    color: 'text-brand-500',
    bg: 'bg-brand-600/15',
    title: 'El pago no se completó',
    text: 'No se realizó ningún cargo. Puedes intentar de nuevo.',
  },
  demo: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    title: '¡Pedido simulado con éxito!',
    text: 'Esto es una demostración. Conecta Supabase y MercadoPago para pedidos reales.',
  },
}

const STATUS_PILL = {
  success: { label: 'Pagado', cls: 'bg-emerald-400/15 text-emerald-400' },
  pending: { label: 'Pendiente', cls: 'bg-amber-400/15 text-amber-400' },
  demo: { label: 'Demo', cls: 'bg-emerald-400/15 text-emerald-400' },
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const { user } = useAuth()
  const status = resolveStatus(searchParams.get('status'))
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [standalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
  )

  useEffect(() => {
    if (status !== 'failure') clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (id && id !== 'demo' && isSupabaseConfigured) {
      setLoading(true)
      getOrderById(id)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [id])

  const view = VIEWS[status]
  const Icon = view.icon

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${view.bg}`}>
        <Icon className={`h-11 w-11 ${view.color}`} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-fg">{view.title}</h1>
      <p className="mt-3 text-fg-muted">{view.text}</p>

      {loading && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}

      {/* Tarjeta del pedido (diseño 05) */}
      {id && id !== 'demo' && status !== 'failure' && (
        <div className="mt-6 rounded-[14px] border border-line bg-surface p-4 text-left">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-fg-subtle">Pedido</p>
              <p className="font-display text-lg font-bold text-fg">
                #{id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            {STATUS_PILL[status] && (
              <span
                className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ${STATUS_PILL[status].cls}`}
              >
                {STATUS_PILL[status].label}
              </span>
            )}
          </div>
          {order && (
            <>
              <div className="flex justify-between border-t border-line pt-3 text-[12.5px] text-fg-muted">
                <span>
                  {order.order_items?.reduce((n, i) => n + i.quantity, 0)} artículo
                  {order.order_items?.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'}
                </span>
                <span className="font-medium text-fg">{formatPrice(order.total)}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-xs text-fg-muted">
                {order.delivery_method === 'pickup' ? (
                  <>
                    <Store className="h-[15px] w-[15px] shrink-0 text-brand-500" strokeWidth={1.7} />
                    Recoge en tienda · {STORE.city.split(',')[0]}
                  </>
                ) : (
                  <>
                    <Truck className="h-[15px] w-[15px] shrink-0 text-brand-500" strokeWidth={1.7} />
                    Envío a domicilio · 2–4 días hábiles
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Banner instalar PWA (diseño 05) */}
      {!standalone && status !== 'failure' && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent-400/25 bg-accent-400/10 px-3.5 py-3 text-left">
          <Download className="h-[19px] w-[19px] shrink-0 text-accent-400" strokeWidth={1.8} />
          <span className="text-xs text-accent-400">
            Instala MBG Sport para seguir tu pedido
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2.5">
        {status === 'failure' ? (
          <Link to="/checkout" className="btn-primary w-full">
            Intentar de nuevo
          </Link>
        ) : (
          <>
            {id && id !== 'demo' && (
              <Link
                to={user ? `/cuenta/pedidos/${id}` : '/cuenta/login'}
                className="btn-primary w-full"
              >
                Ver mi pedido
              </Link>
            )}
            <Link to="/catalogo" className="btn-ghost w-full">
              Seguir comprando
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </>
        )}
        <p className="mt-2 text-sm text-fg-muted">
          ¿Dudas? Visítanos en {STORE.city} o escríbenos.
        </p>
      </div>
    </div>
  )
}
