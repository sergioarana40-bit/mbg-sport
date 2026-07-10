import { useEffect, useState } from 'react'
import { Eye, Package, Mail, Phone, MapPin, StickyNote } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { formatPrice, ORDER_STATUS } from '../../config'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getAllOrders, updateOrderStatus } from '../../lib/admin'

function fmtDateTime(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_KEYS = Object.keys(ORDER_STATUS)
const selectClass =
  'rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-fg outline-none focus:border-brand-500'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)
    try {
      setOrders(await getAllOrders())
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(order, status) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    setSelected((s) => (s && s.id === order.id ? { ...s, status } : s))
    try {
      await updateOrderStatus(order.id, status)
    } catch {
      load()
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">Pedidos</h1>
          <p className="text-sm text-fg-muted">{orders.length} en total</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field w-auto py-2">
          <option value="all">Todos los estados</option>
          {STATUS_KEYS.map((k) => (
            <option key={k} value={k}>
              {ORDER_STATUS[k].label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-2">
            <Package className="h-7 w-7 text-fg-subtle" />
          </div>
          <p className="mt-4 font-semibold text-fg">Aún no hay pedidos</p>
          <p className="mt-1 text-sm text-fg-muted">
            {isSupabaseConfigured
              ? 'Cuando un cliente compre, el pedido aparecerá aquí.'
              : 'Conecta Supabase para recibir pedidos reales.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition hover:bg-surface-2">
                    <td className="px-4 py-3 font-mono text-xs text-fg-subtle">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">{o.customer_name}</td>
                    <td className="px-4 py-3 text-fg-muted">{fmtDateTime(o.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-fg">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o, e.target.value)}
                        className={selectClass}
                      >
                        {STATUS_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {ORDER_STATUS[k].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(o)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-brand-400"
                        aria-label="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle de pedido */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido #${selected.id.slice(0, 8).toUpperCase()}` : ''}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-fg-muted">{fmtDateTime(selected.created_at)}</span>
            </div>

            {/* Datos del cliente */}
            <div className="space-y-2 rounded-lg bg-surface-2 p-4 text-sm">
              <p className="font-semibold text-fg">{selected.customer_name}</p>
              <p className="flex items-center gap-2 text-fg-muted">
                <Mail className="h-4 w-4 text-fg-subtle" />
                {selected.customer_email}
              </p>
              <p className="flex items-center gap-2 text-fg-muted">
                <Phone className="h-4 w-4 text-fg-subtle" />
                {selected.customer_phone}
              </p>
              <p className="flex items-start gap-2 text-fg-muted">
                <MapPin className="h-4 w-4 shrink-0 text-fg-subtle" />
                {selected.customer_address}
              </p>
              {selected.notes && (
                <p className="flex items-start gap-2 text-fg-muted">
                  <StickyNote className="h-4 w-4 shrink-0 text-fg-subtle" />
                  {selected.notes}
                </p>
              )}
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Productos</h3>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {selected.order_items?.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <span className="text-fg-muted">
                      {i.quantity}× {i.product_name}
                    </span>
                    <span className="font-medium text-fg">
                      {formatPrice(i.price * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totales */}
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Subtotal</dt>
                <dd className="text-fg">{formatPrice(selected.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Envío</dt>
                <dd className="text-fg">
                  {selected.shipping === 0 ? 'Gratis' : formatPrice(selected.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt className="text-fg">Total</dt>
                <dd className="text-brand-500">{formatPrice(selected.total)}</dd>
              </div>
            </dl>

            {/* Cambiar estado */}
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Cambiar estado
              </label>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(selected, e.target.value)}
                className="field"
              >
                {STATUS_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {ORDER_STATUS[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
