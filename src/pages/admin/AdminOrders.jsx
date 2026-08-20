import { useEffect, useState } from 'react'
import {
  Eye,
  Package,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Search,
  Download,
  Printer,
  MessageCircle,
} from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { formatPrice, orderNumber, ORDER_STATUS, STORE } from '../../config'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getAllOrders, updateOrderStatus, subscribeOrders } from '../../lib/admin'
import { exportOrdersCsv } from '../../lib/csv'

function escapeHtml(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

// Nota de pedido imprimible (ventana nueva estilo ticket).
function printOrder(o) {
  const rows = (o.order_items ?? [])
    .map(
      (i) =>
        `<tr><td>${i.quantity}× ${escapeHtml(i.product_name)}</td><td class="r">${formatPrice(
          i.price * i.quantity
        )}</td></tr>`
    )
    .join('')
  const discount = Number(o.discount) > 0
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pedido ${orderNumber(o)}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;color:#000;margin:0;padding:20px;display:flex;justify-content:center}
  .ticket{width:320px}
  h1{font-size:20px;margin:0;text-transform:uppercase;letter-spacing:.04em}
  .sub{font-size:11px;color:#555;margin:2px 0 0}
  .box{border:2px solid #000;border-radius:8px;padding:10px 12px;margin-top:10px}
  .row{display:flex;justify-content:space-between;font-size:12px;margin:2px 0}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}
  td{padding:3px 0;vertical-align:top}
  .r{text-align:right;white-space:nowrap;font-weight:700}
  .tot{border-top:2px solid #000;margin-top:6px;padding-top:6px;font-size:14px;font-weight:800}
  .foot{text-align:center;font-size:11px;color:#555;margin-top:14px}
  .badge{display:inline-block;border:2px solid #000;border-radius:999px;padding:1px 10px;font-size:10px;font-weight:800;text-transform:uppercase}
  @media print{body{padding:0}}
</style></head><body><div class="ticket">
  <h1>${escapeHtml(STORE.name)}</h1>
  <p class="sub">Nota de pedido · ${escapeHtml(STORE.city)}</p>
  <div class="box">
    <div class="row"><b>${orderNumber(o)}</b><span class="badge">${escapeHtml(
      ORDER_STATUS[o.status]?.label || o.status
    )}</span></div>
    <div class="row"><span>${new Date(o.created_at).toLocaleString('es-MX')}</span></div>
  </div>
  <div class="box">
    <div class="row"><b>${escapeHtml(o.customer_name || '')}</b></div>
    ${o.customer_phone ? `<div class="row"><span>Tel: ${escapeHtml(o.customer_phone)}</span></div>` : ''}
    <div class="row"><span>${
      o.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Envío a domicilio'
    }</span></div>
  </div>
  <div class="box">
    <table>${rows}</table>
    <div class="row" style="margin-top:6px"><span>Subtotal</span><span class="r">${formatPrice(
      o.subtotal
    )}</span></div>
    ${
      discount
        ? `<div class="row"><span>Descuento${
            o.coupon_code ? ` (${escapeHtml(o.coupon_code)})` : ''
          }</span><span class="r">−${formatPrice(o.discount)}</span></div>`
        : ''
    }
    <div class="row tot"><span>TOTAL</span><span>${formatPrice(o.total)}</span></div>
  </div>
  <p class="foot">${escapeHtml(STORE.address)}<br>${escapeHtml(
    STORE.hours
  )}<br>¡Gracias por su preferencia!</p>
</div></body></html>`
  const w = window.open('', '_blank', 'width=460,height=700')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  // Se imprime desde el opener (sin <script> inline) para respetar la CSP estricta.
  w.print()
}

// Enlace de WhatsApp al cliente con el resumen del pedido. Si el pedido ya está
// pagado o listo para recoger, el mensaje anuncia "¡Está listo!"; si sigue en
// proceso, confirma la recepción.
function waCustomerLink(o) {
  const digits = (o.customer_phone || '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const phone = digits.length === 10 ? `521${digits}` : digits
  const firstName = (o.customer_name || '').trim().split(/\s+/)[0]
  const ready = ['paid', 'shipped'].includes(o.status)
  const lines = [
    `Hola${firstName ? ` ${firstName}` : ''}, te escribimos de ${STORE.name}.`,
    ready
      ? `Tu pedido ${orderNumber(o)} ¡Está listo! 🎉`
      : `Recibimos tu pedido ${orderNumber(o)}:`,
    ...(o.order_items ?? []).map((i) => `• ${i.quantity}× ${i.product_name}`),
    `Total: ${formatPrice(o.total)}`,
    o.delivery_method === 'pickup'
      ? `Puedes recogerlo en nuestra ${STORE.branch}: ${STORE.address} (${STORE.hours}).`
      : 'Te avisamos en cuanto salga el envío.',
    'Te esperamos 💪',
  ]
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
}

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
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    try {
      setOrders(await getAllOrders())
    } catch {
      /* noop */
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Recarga silenciosa cuando entra o cambia un pedido (Realtime).
    const unsubscribe = subscribeOrders(() => load(false))
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtro por fecha: hoy / semana (desde el lunes) / mes en curso.
  function inDateRange(o) {
    if (dateFilter === 'all' || !o.created_at) return dateFilter === 'all'
    const d = new Date(o.created_at)
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    if (dateFilter === 'today') return d >= startOfDay
    if (dateFilter === 'week') {
      const monday = new Date(startOfDay)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      return d >= monday
    }
    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  }

  async function changeStatus(order, status) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    setSelected((s) => (s && s.id === order.id ? { ...s, status } : s))
    try {
      await updateOrderStatus(order.id, status)
    } catch {
      load()
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = orders
    .filter((o) => (filter === 'all' ? true : o.status === filter))
    .filter(inDateRange)
    .filter((o) => {
      if (!q) return true
      const code = q.replace(/^#/, '')
      return (
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().startsWith(code) ||
        orderNumber(o).slice(1).toLowerCase().startsWith(code)
      )
    })

  const controlClass =
    'cursor-pointer rounded-lg border-2 border-ink bg-white px-3 py-2 text-[12.5px] font-semibold text-fg outline-none focus:border-brand-600'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Pedidos</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">
            {filtered.length} de {orders.length} pedido{orders.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, correo o #pedido…"
              className="h-[38px] w-52 rounded-lg border-2 border-ink bg-white pl-8 pr-3 text-[12.5px] font-semibold text-fg placeholder:font-medium placeholder:text-fg-subtle focus:border-brand-600 focus:outline-none"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={controlClass}
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={controlClass}
          >
            <option value="all">Todos los estados</option>
            {STATUS_KEYS.map((k) => (
              <option key={k} value={k}>
                {ORDER_STATUS[k].label}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportOrdersCsv(filtered, ORDER_STATUS)}
            disabled={filtered.length === 0}
            title="Descargar los pedidos filtrados como CSV"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3.5 py-2 font-display text-[11px] font-extrabold uppercase text-fg transition hover:bg-surface-2 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            Exportar
          </button>
        </div>
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
                      {orderNumber(o)}
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center font-medium text-fg-subtle">
                      Ningún pedido coincide con la búsqueda o los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle de pedido */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido ${orderNumber(selected)}` : ''}
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

            {/* Nota de pedido: imprimir o enviar por WhatsApp */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                onClick={() => printOrder(selected)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-ink font-display text-[11.5px] font-extrabold uppercase text-white transition hover:bg-ink-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir nota
              </button>
              {waCustomerLink(selected) ? (
                <a
                  href={waCustomerLink(selected)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-2 border-ink bg-accent-400 font-display text-[11.5px] font-extrabold uppercase text-fg transition hover:bg-accent-300"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp al cliente
                </a>
              ) : (
                <span className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-2 border-[#d9d9d9] font-display text-[11.5px] font-extrabold uppercase text-fg-subtle">
                  Sin teléfono válido
                </span>
              )}
            </div>

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
