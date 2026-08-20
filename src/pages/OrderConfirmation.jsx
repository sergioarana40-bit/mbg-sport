import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Truck, Store, Download } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { getOrderById, getOrderFolio } from '../lib/api'
import { formatPrice, orderNumber, STORE } from '../config'
import { isSupabaseConfigured } from '../lib/supabase'

function resolveStatus(raw) {
  return raw === 'demo' ? 'demo' : 'success'
}

// Círculo sticker del póster (amarillo con check).
const VIEWS = {
  success: {
    icon: CheckCircle2,
    color: 'text-fg',
    bg: 'bg-accent-400',
    title: '¡Pedido confirmado!',
    text: 'Lo estamos preparando. Pagas al recogerlo en la tienda, en efectivo o con tarjeta.',
  },
  demo: {
    icon: CheckCircle2,
    color: 'text-fg',
    bg: 'bg-accent-400',
    title: '¡Pedido simulado con éxito!',
    text: 'Esto es una demostración. Conecta Supabase para pedidos reales.',
  },
}

const STATUS_PILL = {
  success: { label: 'Confirmado' },
  demo: { label: 'Demo' },
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const { user } = useAuth()
  const status = resolveStatus(searchParams.get('status'))
  const [order, setOrder] = useState(null)
  // Folio corto vía RPC: el invitado no puede releer su pedido, pero sí su folio.
  const [folio, setFolio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [standalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
  )

  useEffect(() => {
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (id && id !== 'demo' && isSupabaseConfigured) {
      setLoading(true)
      getOrderById(id)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false))
      getOrderFolio(id)
        .then(setFolio)
        .catch(() => {})
    }
  }, [id])

  const view = VIEWS[status]
  const Icon = view.icon

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className={`mx-auto grid h-[84px] w-[84px] place-items-center rounded-full border-[3px] border-ink shadow-hard ${view.bg}`}
      >
        <Icon className={`h-10 w-10 ${view.color}`} strokeWidth={2.5} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-black uppercase leading-none text-fg">
        {view.title}
      </h1>
      <p className="mt-3 text-sm font-medium leading-relaxed text-[#4a4a4a]">{view.text}</p>

      {loading && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}

      {/* Tarjeta del pedido (sticker, diseño 1b) */}
      {id && id !== 'demo' && (
        <div className="sticker mt-6 p-[18px] text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-fg-subtle">
                Pedido
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold text-fg">
                {orderNumber({ id, folio: order?.folio ?? folio })}
              </p>
            </div>
            {STATUS_PILL[status] && (
              <span className="rounded-full border-2 border-ink bg-accent-400 px-3 py-1 font-display text-[10px] font-extrabold uppercase text-fg">
                {STATUS_PILL[status].label}
              </span>
            )}
          </div>
          {order && (
            <>
              <div className="mt-3.5 flex justify-between border-t-2 border-ink pt-3 text-[12.5px]">
                <span className="font-medium text-[#4a4a4a]">
                  {order.order_items?.reduce((n, i) => n + i.quantity, 0)} artículo
                  {order.order_items?.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'}
                </span>
                <span className="font-display font-extrabold text-fg">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-fg">
                {order.delivery_method === 'pickup' ? (
                  <>
                    <Store className="h-[15px] w-[15px] shrink-0 text-brand-600" strokeWidth={2} />
                    <span>
                      Recoge en tienda · {STORE.branch} · Listo hoy
                      {STORE.maps && (
                        <>
                          {' · '}
                          <a
                            href={STORE.maps}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 underline underline-offset-2"
                          >
                            Cómo llegar
                          </a>
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Truck className="h-[15px] w-[15px] shrink-0 text-brand-600" strokeWidth={2} />
                    Envío a domicilio · 2–4 días hábiles
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Banner instalar PWA */}
      {!standalone && (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border-2 border-ink bg-accent-400 px-3.5 py-3 text-left">
          <Download className="h-[19px] w-[19px] shrink-0 text-fg" strokeWidth={2} />
          <span className="text-xs font-bold text-fg">
            Instala {STORE.name} para seguir tu pedido
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {id && id !== 'demo' && (
          <Link
            to={user ? `/cuenta/pedidos/${id}` : '/cuenta/login'}
            className="btn-sticker h-[50px] w-full"
          >
            Ver mi pedido
          </Link>
        )}
        <Link to="/catalogo" className="btn-secondary h-12 w-full">
          Seguir comprando
          <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.5} />
        </Link>
        <p className="mt-2 text-xs font-medium text-fg-subtle">
          ¿Dudas? Visítanos en la {STORE.branch} o escríbenos por WhatsApp.
        </p>
      </div>
    </div>
  )
}
