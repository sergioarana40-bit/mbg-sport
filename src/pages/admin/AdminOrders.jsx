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
  'cursor-pointer rounded-lg border-2 border-ink bg-white px-2 py-1 text-xs font-bold text-fg outline-none focus:border-brand-600'

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Pedidos</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">{orders.length} en total</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-auto cursor-pointer rounded-lg border-2 border-ink bg-white px-3.5 py-2 text-[12.5px] font-semibold text-fg outline-none focus:border-brand-600"
        >
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
        <div className="rounded-[10px] border-2 border-dashed border-ink py-20 text-center">
          <div className="sticker mx-auto grid h-14 w-14 place-items-center rounded-full">
            <Package className="h-7 w-7 text-fg" />
          </div>
          <p className="mt-4 font-display font-extrabold uppercase text-fg">Aún no hay pedidos</p>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            {isSupabaseConfigured
              ? 'Cuando un cliente compre, el pedido aparecerá aquí.'
              : 'Conecta Supabase para recibir pedidos reales.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink text-left text-[10px] uppercase tracking-[.08em] text-white">
                  <th className="px-4 py-3 font-bold">Pedido</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition hover:bg-surface-2">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-fg">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-fg">{o.customer_name}</td>
                    <td className="px-4 py-3 font-medium text-[#4a4a4a]">
                      {fmtDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-3 font-bold text-fg">{formatPrice(o.total)}</td>
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
                        className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                        aria-label="Ver detalle"
                      >
                        <Eye className="h-3.5 w-3.5" />
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
              <span className="text-[12.5px] font-medium text-fg-subtle">
                {fmtDateTime(selected.created_at)}
              </span>
            </div>

            {/* Datos del cliente */}
            <div className="space-y-2 rounded-[10px] border-2 border-ink bg-surface-2 p-4 text-sm">
              <p className="font-bold text-fg">{selected.customer_name}</p>
              <p className="flex items-center gap-2 font-medium text-[#4a4a4a]">
                <Mail className="h-4 w-4 text-fg-subtle" />
                {selected.customer_email}
              </p>
              <p className="flex items-center gap-2 font-medium text-[#4a4a4a]">
                <Phone className="h-4 w-4 text-fg-subtle" />
                {selected.customer_phone}
              </p>
              <p className="flex items-start gap-2 font-medium text-[#4a4a4a]">
                <MapPin className="h-4 w-4 shrink-0 text-fg-subtle" />
                {selected.customer_address}
              </p>
              {selected.notes && (
                <p className="flex items-start gap-2 font-medium text-[#4a4a4a]">
                  <StickyNote className="h-4 w-4 shrink-0 text-fg-subtle" />
                  {selected.notes}
                </p>
              )}
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-[12.5px] font-bold uppercase tracking-[.06em] text-fg">
                Productos
              </h3>
              <ul className="divide-y divide-[#e5e5e5] rounded-[10px] border-2 border-ink">
                {selected.order_items?.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <span className="font-medium text-[#4a4a4a]">
                      {i.quantity}× {i.product_name}
                    </span>
                    <span className="font-bold text-fg">
                      {formatPrice(i.price * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totales */}
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">Subtotal</dt>
                <dd className="font-bold text-fg">{formatPrice(selected.subtotal)}</dd>
              </div>
              {Number(selected.discount) > 0 && (
                <div className="flex justify-between">
                  <dt className="font-semibold text-brand-600">
                    Descuento{selected.coupon_code ? ` (${selected.coupon_code})` : ''}
                  </dt>
                  <dd className="font-bold text-brand-600">−{formatPrice(selected.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-[#4a4a4a]">
                  {selected.delivery_method === 'pickup' ? 'Recogida en tienda' : 'Envío'}
                </dt>
                <dd className="font-bold text-fg">
                  {Number(selected.shipping) === 0 ? 'Gratis' : formatPrice(selected.shipping)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t-2 border-ink pt-2.5">
                <dt className="font-display text-[15px] font-extrabold uppercase text-fg">Total</dt>
                <dd>
                  <span className="price-tag text-lg">{formatPrice(selected.total)}</span>
                </dd>
              </div>
            </dl>

            {/* Cambiar estado */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
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
