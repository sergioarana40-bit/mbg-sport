import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { getStats } from '../../lib/admin'
import { formatPrice } from '../../config'

const DAY_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const money = (v) => formatPrice(v).replace(/\.00\b/, '')

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  // Tarjetas del póster 1b: etiqueta pequeña + número Montserrat 900 + nota.
  // highlight=true pinta la nota con marcador amarillo; danger=true en rojo.
  const cards = [
    {
      label: 'Ventas del mes',
      value: money(stats.revenueMonth),
      note:
        stats.monthDelta === null
          ? 'Sin datos del mes anterior'
          : `${stats.monthDelta >= 0 ? '▲' : '▼'} ${Math.abs(stats.monthDelta)}%`,
      suffix: stats.monthDelta === null ? '' : ' vs. mes anterior',
      highlight: stats.monthDelta !== null && stats.monthDelta >= 0,
      danger: stats.monthDelta !== null && stats.monthDelta < 0,
    },
    {
      label: 'Pedidos',
      value: stats.orderCount,
      note: `${stats.ordersToday} nuevo${stats.ordersToday === 1 ? '' : 's'} hoy`,
      suffix: '',
    },
    {
      label: 'Productos',
      value: stats.productCount,
      note:
        stats.lowStock.length > 0
          ? `${stats.lowStock.length} con stock bajo`
          : 'Stock saludable',
      suffix: '',
      danger: stats.lowStock.length > 0,
    },
    {
      label: 'Clientes',
      value: stats.clientCount,
      note: `▲ ${stats.clientsThisWeek}`,
      suffix: ' esta semana',
      highlight: true,
    },
  ]

  const maxSale = Math.max(1, ...stats.salesByDay.map((d) => d.total))
  const cardTitle =
    'text-[12.5px] font-bold uppercase tracking-[.06em] text-fg'

  return (
    <div className="space-y-4">
      {stats.demo && (
        <div className="rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          Estás viendo datos de ejemplo. Al conectar Supabase, el dashboard mostrará tus
          ventas reales.
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Dashboard</span>
          </h1>
          <p className="mt-2 text-xs font-medium capitalize text-fg-subtle">
            Resumen · {monthLabel}
          </p>
        </div>
        <Link
          to="/admin/productos"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Nuevo producto
        </Link>
      </div>

      {/* Tarjetas de métricas (stickers) */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="sticker-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.08em] text-fg-subtle">
              {c.label}
            </p>
            <p className="mt-2 font-display text-[26px] font-black leading-none text-fg">
              {c.value}
            </p>
            <p className="mt-2 text-[11px] font-bold">
              {c.highlight ? (
                <span className="bg-accent-400 px-1.5 py-px">{c.note}</span>
              ) : (
                <span className={c.danger ? 'text-brand-600' : 'text-[#4a4a4a]'}>{c.note}</span>
              )}
              {c.suffix && <span className="font-semibold text-[#4a4a4a]">{c.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        {/* Ventas · últimos 7 días (barras negras, la mayor en rojo) */}
        <div className="rounded-[10px] border-2 border-ink bg-white px-[18px] py-4">
          <h2 className={cardTitle}>Ventas · últimos 7 días</h2>
          <div className="mt-3.5 flex h-[120px] items-end gap-3 border-b-2 border-ink">
            {stats.salesByDay.map((d) => {
              const top = d.total === maxSale && d.total > 0
              return (
                <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={top ? 'w-full border-2 border-ink bg-brand-600' : 'w-full bg-ink'}
                    style={{ height: `${Math.max(d.total > 0 ? 8 : 2, (d.total / maxSale) * 100)}%` }}
                    title={formatPrice(d.total)}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-3 text-center text-[10px] font-bold text-fg-subtle">
            {stats.salesByDay.map((d) => {
              const top = d.total === maxSale && d.total > 0
              return (
                <span key={d.date} className={`flex-1 ${top ? 'text-brand-600' : ''}`}>
                  {DAY_LETTER[d.day]}
                </span>
              )
            })}
          </div>
        </div>

        {/* Stock bajo */}
        <div className="rounded-[10px] border-2 border-ink bg-white px-[18px] py-4">
          <h2 className={cardTitle}>Stock bajo</h2>
          {stats.lowStock.length === 0 ? (
            <p className="py-6 text-center text-xs font-medium text-fg-subtle">
              Todo el inventario está sano.
            </p>
          ) : (
            <div className="mt-1 divide-y divide-[#e5e5e5]">
              {stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-[9px]">
                  <span className="truncate text-[12.5px] font-semibold text-fg">{p.name}</span>
                  <span
                    className={`rounded-[5px] border-2 border-ink px-2 font-display text-[11px] font-extrabold ${
                      (p.stock ?? 0) <= 4 ? 'bg-brand-600 text-white' : 'bg-accent-400 text-fg'
                    }`}
                  >
                    {p.stock ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="rounded-[10px] border-2 border-ink bg-white px-[18px] py-4">
        <div className="flex items-center justify-between">
          <h2 className={cardTitle}>Pedidos recientes</h2>
          <Link
            to="/admin/pedidos"
            className="text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Ver todos
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-fg-subtle">
            Aún no hay pedidos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="mt-3 grid grid-cols-[1.1fr_1.4fr_1fr_1.1fr] gap-2 border-b-2 border-ink pb-2 text-[10px] font-bold uppercase tracking-[.08em] text-fg-subtle">
                <span>Pedido</span>
                <span>Cliente</span>
                <span>Total</span>
                <span>Estado</span>
              </div>
              {stats.recentOrders.map((o, i) => (
                <div
                  key={o.id}
                  className={`grid grid-cols-[1.1fr_1.4fr_1fr_1.1fr] items-center gap-2 py-2.5 text-[12.5px] ${
                    i < stats.recentOrders.length - 1 ? 'border-b border-[#e5e5e5]' : ''
                  }`}
                >
                  <span className="font-mono font-bold text-fg">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="truncate font-semibold text-fg">
                    {o.customer_name || 'Cliente'}
                  </span>
                  <span className="font-bold text-fg">{formatPrice(o.total)}</span>
                  <span>
                    <StatusBadge status={o.status} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
