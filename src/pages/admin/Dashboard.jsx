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
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pedidos',
      value: stats.orderCount,
      icon: ShoppingBag,
      tint: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      tint: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Productos',
      value: stats.productCount,
      icon: Package,
      tint: 'bg-brand-50 text-brand-600',
    },
  ]

  const maxSale = Math.max(1, ...stats.salesByDay.map((d) => d.total))

  return (
    <div className="space-y-6">
      {stats.demo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Estás viendo datos de ejemplo. Al conectar Supabase, el dashboard mostrará tus
          ventas reales.
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-neutral-900">
              {c.value}
            </p>
            <p className="text-sm text-neutral-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Gráfica de ventas */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h2 className="font-display text-lg font-bold text-neutral-900">
              Ventas (últimos 14 días)
            </h2>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {stats.salesByDay.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand-500 transition-all group-hover:bg-brand-600"
                    style={{ height: `${(d.total / maxSale) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                    title={formatPrice(d.total)}
                  />
                </div>
                <span className="text-[9px] text-neutral-400">{fmtDate(d.date).split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-neutral-900">
              Pedidos recientes
            </h2>
            <Link to="/admin/pedidos" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 divide-y divide-neutral-100">
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                Aún no hay pedidos.
              </p>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {o.customer_name || 'Cliente'}
                    </p>
                    <p className="text-xs text-neutral-400">{fmtDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-neutral-900">
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
