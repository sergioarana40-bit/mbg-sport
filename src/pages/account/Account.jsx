import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { LogOut, Package, ShieldCheck, Check, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { formatPrice } from '../../config'
import { getMyOrders, updateProfile } from '../../lib/account'

function fmtDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function Account() {
  const { user, profile, isAdmin, loading, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setOrdersLoading(true)
    getMyOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false))
  }, [user])

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
  }, [profile])

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/cuenta/login" replace />

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(user.id, form)
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      /* noop */
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Mi cuenta
          </h1>
          <p className="text-sm text-fg-muted">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>

      {isAdmin && (
        <Link
          to="/admin"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-brand-600/30 bg-brand-600/10 p-4 transition hover:bg-brand-600/15"
        >
          <ShieldCheck className="h-5 w-5 text-brand-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-fg">Tienes acceso de administrador</p>
            <p className="text-xs text-fg-muted">Gestiona productos, pedidos y estadísticas.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-fg-subtle" />
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Perfil */}
        <form
          onSubmit={handleSave}
          className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-display text-lg font-bold text-fg">Mis datos</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Nombre</label>
            <input
              className="field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Teléfono</label>
            <input
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
              saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {saving ? (
              <Spinner size={5} className="mx-auto border-white/40 border-t-white" />
            ) : saved ? (
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> Guardado
              </span>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </form>

        {/* Historial de pedidos */}
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-fg">Mis pedidos</h2>
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-2">
                <Package className="h-7 w-7 text-fg-subtle" />
              </div>
              <p className="mt-4 font-semibold text-fg">Aún no tienes pedidos</p>
              <Link
                to="/catalogo"
                className="mt-3 inline-block text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-fg-subtle">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-fg-muted">{fmtDate(o.created_at)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                    {o.order_items?.map((i) => (
                      <li key={i.id} className="flex justify-between gap-3 text-fg-muted">
                        <span>
                          {i.quantity}× {i.product_name}
                        </span>
                        <span>{formatPrice(i.price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold">
                    <span className="text-fg">Total</span>
                    <span className="text-brand-500">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
