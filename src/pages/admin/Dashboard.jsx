import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, ShoppingBag, Clock, Package, TrendingUp } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { getStats } from '../../lib/admin'
import { formatPrice } from '../../config'

function fmtDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(
    new Date(iso)
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const cards = [
    {
      label: 'Ingresos',
      value: formatPrice(stats.revenue),
      icon: DollarSign,
      tint: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      label: 'Pedidos',
      value: stats.orderCount,
      icon: ShoppingBag,
      tint: 'bg-blue-500/15 text-blue-400',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      tint: 'bg-amber-500/15 text-amber-400',
    },
    {
      label: 'Productos',
      value: stats.productCount,
      icon: Package,
      tint: 'bg-brand-600/15 text-brand-400',
    },
  ]

  const maxSale = Math.max(1, ...stats.salesByDay.map((d) => d.total))

  return (
    <div className="space-y-6">
      {stats.demo && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Estás viendo datos de ejemplo. Al conectar Supabase, el dashboard mostrará tus
          ventas reales.
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-fg">{c.value}</p>
            <p className="text-sm text-fg-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Gráfica de ventas */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-fg">
              Ventas (últimos 14 días)
            </h2>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {stats.salesByDay.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand-600 transition-all group-hover:bg-brand-500"
                    style={{
                      height: `${(d.total / maxSale) * 100}%`,
                      minHeight: d.total > 0 ? '4px' : '0',
                    }}
                    title={formatPrice(d.total)}
                  />
                </div>
                <span className="text-[9px] text-fg-subtle">
                  {fmtDate(d.date).split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-fg">Pedidos recientes</h2>
            <Link
              to="/admin/pedidos"
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-fg-subtle">Aún no hay pedidos.</p>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {o.customer_name || 'Cliente'}
                    </p>
                    <p className="text-xs text-fg-subtle">{fmtDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-fg">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
