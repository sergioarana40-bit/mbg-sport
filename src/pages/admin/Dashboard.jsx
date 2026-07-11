import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { getStats } from '../../lib/admin'
import { formatPrice } from '../../config'

const DAY_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

// Tonos de rojo para las barras según su intensidad (diseño 11).
function barColor(ratio) {
  if (ratio >= 0.9) return '#dc2626'
  if (ratio >= 0.65) return '#b91c1c'
  if (ratio >= 0.35) return '#7f1d1d'
  return '#3f1d1d'
}

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

  // Tarjetas del diseño 11: etiqueta pequeña + número Oswald + delta coloreado.
  const cards = [
    {
      label: 'Ventas del mes',
      value: money(stats.revenueMonth),
      note:
        stats.monthDelta === null
          ? 'Sin datos del mes anterior'
          : `${stats.monthDelta >= 0 ? '▲' : '▼'} ${Math.abs(stats.monthDelta)}% vs. mes anterior`,
      noteCls:
        stats.monthDelta === null
          ? 'text-fg-subtle'
          : stats.monthDelta >= 0
            ? 'text-emerald-400'
            : 'text-brand-400',
    },
    {
      label: 'Pedidos',
      value: stats.orderCount,
      note: `${stats.ordersToday} nuevo${stats.ordersToday === 1 ? '' : 's'} hoy`,
      noteCls: 'text-accent-400',
    },
    {
      label: 'Productos',
      value: stats.productCount,
      note:
        stats.lowStock.length > 0
          ? `${stats.lowStock.length} con stock bajo`
          : 'Stock saludable',
      noteCls: stats.lowStock.length > 0 ? 'text-brand-400' : 'text-emerald-400',
    },
    {
      label: 'Clientes',
      value: stats.clientCount,
      note: `▲ ${stats.clientsThisWeek} esta semana`,
      noteCls: 'text-emerald-400',
    },
  ]

  const maxSale = Math.max(1, ...stats.salesByDay.map((d) => d.total))

  return (
    <div className="space-y-5">
      {stats.demo && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Estás viendo datos de ejemplo. Al conectar Supabase, el dashboard mostrará tus
          ventas reales.
        </div>
      )}

      {/* Encabezado (diseño 11) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-fg">Dashboard</h1>
          <p className="text-[12.5px] capitalize text-fg-subtle">Resumen · {monthLabel}</p>
        </div>
        <Link
          to="/admin/productos"
          className="inline-flex items-center gap-2 rounded-[11px] bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nuevo producto
        </Link>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[14px] border border-line bg-surface p-4">
            <p className="text-[11.5px] text-fg-subtle">{c.label}</p>
            <p className="mt-1.5 font-display text-[26px] font-bold leading-none text-fg">
              {c.value}
            </p>
            <p className={`mt-1.5 text-[11px] ${c.noteCls}`}>{c.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        {/* Ventas · últimos 7 días (diseño 11) */}
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <h2 className="mb-4 text-[13px] font-semibold text-fg">Ventas · últimos 7 días</h2>
          <div className="flex h-[118px] items-end gap-3">
            {stats.salesByDay.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-[6px] transition-all"
                    style={{
                      height: `${Math.max(d.total > 0 ? 8 : 2, (d.total / maxSale) * 100)}%`,
                      background: d.total > 0 ? barColor(d.total / maxSale) : '#1c1c21',
                    }}
                    title={formatPrice(d.total)}
                  />
                </div>
                <span className="text-[9.5px] text-fg-subtle">{DAY_LETTER[d.day]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock bajo (diseño 11) */}
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <h2 className="mb-2 text-[13px] font-semibold text-fg">Stock bajo</h2>
          {stats.lowStock.length === 0 ? (
            <p className="py-6 text-center text-xs text-fg-subtle">
              Todo el inventario está sano.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-[12.5px] text-[#d4d4d8]">{p.name}</span>
                  <span
                    className={`text-[11.5px] font-bold ${
                      (p.stock ?? 0) <= 4 ? 'text-brand-400' : 'text-accent-400'
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

      {/* Pedidos recientes (diseño 11) */}
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-fg">Pedidos recientes</h2>
          <Link
            to="/admin/pedidos"
            className="text-xs font-medium text-brand-500 hover:text-brand-400"
          >
            Ver todos
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-subtle">Aún no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-[1.1fr_1.4fr_1fr_1.1fr] gap-2 border-b border-line pb-2 text-[10.5px] uppercase tracking-[.05em] text-fg-subtle">
                <span>Pedido</span>
                <span>Cliente</span>
                <span>Total</span>
                <span>Estado</span>
              </div>
              {stats.recentOrders.map((o, i) => (
                <div
                  key={o.id}
                  className={`grid grid-cols-[1.1fr_1.4fr_1fr_1.1fr] items-center gap-2 py-2.5 text-[12.5px] ${
                    i < stats.recentOrders.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <span className="font-display font-semibold text-fg">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="truncate text-[#d4d4d8]">{o.customer_name || 'Cliente'}</span>
                  <span className="text-[#d4d4d8]">{formatPrice(o.total)}</span>
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
