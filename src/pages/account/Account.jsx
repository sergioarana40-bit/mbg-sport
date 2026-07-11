import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import {
  LogOut,
  Package,
  ShieldCheck,
  Check,
  ChevronRight,
  Bell,
  Heart,
  MapPin,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import AddressManager from '../../components/AddressManager'
import { formatPrice } from '../../config'
import { getMyOrders, updateProfile, setNotifications } from '../../lib/account'
import { getProductsByIds } from '../../lib/api'

function fmtDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function initials(name, email) {
  const source = (name || email || '?').trim()
  return source
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Estados en los que el pedido sigue "vivo" (se puede seguir).
const ACTIVE_STATES = ['pending', 'paid', 'processing', 'shipped']

export default function Account() {
  const { user, profile, isAdmin, loading, refreshProfile, signOut } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifOn, setNotifOn] = useState(true)
  const [rebuying, setRebuying] = useState(null)

  useEffect(() => {
    if (!user) return
    setOrdersLoading(true)
    getMyOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false))
  }, [user])

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      setNotifOn(profile.notifications_enabled !== false)
    }
  }, [profile])

  async function toggleNotif() {
    const next = !notifOn
    setNotifOn(next)
    try {
      await setNotifications(user.id, next)
      await refreshProfile()
    } catch {
      setNotifOn(!next)
    }
  }

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
      setTimeout(() => {
        setSaved(false)
        setEditing(false)
      }, 1200)
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

  // "Volver a comprar": re-agrega los artículos del pedido al carrito.
  async function rebuy(order) {
    setRebuying(order.id)
    try {
      const ids = order.order_items?.map((i) => i.product_id).filter(Boolean) ?? []
      const products = await getProductsByIds(ids)
      const byId = new Map(products.map((p) => [p.id, p]))
      let addedAny = false
      order.order_items?.forEach((i) => {
        const p = byId.get(i.product_id)
        if (p && (p.stock ?? 0) > 0) {
          addItem(p, i.quantity)
          addedAny = true
        }
      })
      if (addedAny) navigate('/carrito')
    } catch {
      /* noop */
    } finally {
      setRebuying(null)
    }
  }

  const menuItem =
    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2'
  const menuIcon =
    'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-surface-2 text-brand-500'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Mi cuenta
      </h1>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Columna izquierda: perfil, menú y direcciones (diseño 09) */}
        <div className="space-y-4">
          {/* Tarjeta de perfil */}
          <div className="rounded-[15px] border border-line bg-surface p-4">
            <div className="flex items-center gap-3.5">
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-brand-600 font-display text-lg font-bold text-white">
                {initials(profile?.full_name, user.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-fg">
                  {profile?.full_name || 'Completa tu perfil'}
                </p>
                <p className="truncate text-xs text-fg-muted">{user.email}</p>
              </div>
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-[12.5px] font-semibold text-brand-500 transition hover:text-brand-400"
              >
                {editing ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            {editing && (
              <form onSubmit={handleSave} className="mt-4 space-y-3 border-t border-line pt-4">
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
            )}
          </div>

          {/* Menú (diseño 09) */}
          <div className="divide-y divide-line overflow-hidden rounded-[15px] border border-line bg-surface">
            <a href="#pedidos" className={menuItem}>
              <span className={menuIcon}>
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-sm font-medium text-fg">Mis pedidos</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" />
            </a>
            <Link to="/favoritos" className={menuItem}>
              <span className={menuIcon}>
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-sm font-medium text-fg">Favoritos</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" />
            </Link>
            <a href="#direcciones" className={menuItem}>
              <span className={menuIcon}>
                <MapPin className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-sm font-medium text-fg">Direcciones</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" />
            </a>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className={menuIcon}>
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-sm font-medium text-fg">Notificaciones</span>
              <button
                onClick={toggleNotif}
                role="switch"
                aria-checked={notifOn}
                aria-label="Notificaciones"
                className={`relative h-[23px] w-10 shrink-0 rounded-full transition ${
                  notifOn ? 'bg-brand-600' : 'bg-surface-3'
                }`}
              >
                <span
                  className={`absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition-all ${
                    notifOn ? 'left-[20px]' : 'left-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cerrar sesión (diseño 09) */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-brand-500/30 py-3.5 text-sm font-semibold text-brand-400 transition hover:bg-brand-600/10"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.8} />
            Cerrar sesión
          </button>

          {/* Direcciones */}
          <div id="direcciones" className="scroll-mt-32">
            <AddressManager userId={user.id} />
          </div>
        </div>

        {/* Historial de pedidos (diseño 09) */}
        <div id="pedidos" className="scroll-mt-32">
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
              {orders.map((o) => {
                const itemCount = o.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0
                const active = ACTIVE_STATES.includes(o.status)
                return (
                  <div key={o.id} className="rounded-[15px] border border-line bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/cuenta/pedidos/${o.id}`} className="min-w-0 transition hover:opacity-80">
                        <p className="font-display text-[17px] font-bold text-fg">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11.5px] text-fg-subtle">
                          {fmtDate(o.created_at)} · {itemCount} artículo{itemCount === 1 ? '' : 's'}
                        </p>
                      </Link>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
                      <span className="font-display text-base font-semibold text-fg">
                        {formatPrice(o.total)}
                      </span>
                      {active ? (
                        <Link
                          to={`/cuenta/pedidos/${o.id}`}
                          className="inline-flex items-center gap-1.5 rounded-[10px] bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          Seguir pedido
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => rebuy(o)}
                          disabled={rebuying === o.id}
                          className="text-xs font-semibold text-fg-muted transition hover:text-fg disabled:opacity-50"
                        >
                          {rebuying === o.id ? 'Agregando…' : 'Volver a comprar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
