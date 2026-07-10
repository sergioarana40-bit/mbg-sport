import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, Package, ArrowRight } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
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

export default function OrderConfirmation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const status = resolveStatus(searchParams.get('status'))
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

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

      {id && id !== 'demo' && (
        <p className="mt-4 inline-block rounded-lg bg-surface-2 px-4 py-2 text-sm text-fg-muted">
          Pedido{' '}
          <span className="font-mono font-semibold text-fg">
            #{id.slice(0, 8).toUpperCase()}
          </span>
        </p>
      )}

      {loading && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}

      {order && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-left">
          <h2 className="flex items-center gap-2 font-semibold text-fg">
            <Package className="h-4.5 w-4.5 text-brand-500" />
            Resumen del pedido
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {order.order_items?.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-fg-muted">
                <span>
                  {i.quantity}× {i.product_name}
                </span>
                <span className="font-medium text-fg">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold text-fg">
            <span>Total</span>
            <span className="text-brand-500">{formatPrice(order.total)}</span>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        {status === 'failure' ? (
          <Link to="/checkout" className="btn-primary">
            Intentar de nuevo
          </Link>
        ) : (
          <Link to="/catalogo" className="btn-primary">
            Seguir comprando
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        )}
        <p className="text-sm text-fg-muted">
          ¿Dudas? Visítanos en {STORE.city} o escríbenos.
        </p>
      </div>
    </div>
  )
}
