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
  KeyRound,
  MapPin,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import AddressManager from '../../components/AddressManager'
import { formatPrice } from '../../config'
import { getMyOrders, updateProfile, setNotifications, changePassword } from '../../lib/account'
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

  // Cambio de contraseña
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

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
    navigate('/tienda')
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    if (!pwForm.current) {
      setPwError('Escribe tu contraseña actual.')
      return
    }
    if (pwForm.password.length < 8) {
      setPwError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden.')
      return
    }
    setPwSaving(true)
    try {
      await changePassword(pwForm.current, pwForm.password)
      setPwForm({ current: '', password: '', confirm: '' })
      setPwSaved(true)
      setTimeout(() => {
        setPwSaved(false)
        setPwOpen(false)
      }, 1500)
    } catch (err) {
      setPwError(err.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setPwSaving(false)
    }
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
    'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2'
  const menuIcon =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="title-stamp text-lg sm:text-2xl">
        <span>Mi cuenta</span>
      </h1>

      {isAdmin && (
        <Link
          to="/admin"
          className="mt-6 flex items-center gap-3 rounded-[10px] border-2 border-ink bg-accent-400 p-4 transition hover:bg-accent-300"
        >
          <ShieldCheck className="h-5 w-5 text-fg" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-bold text-fg">Tienes acceso de administrador</p>
            <p className="text-xs font-medium text-fg">
              Gestiona productos, pedidos y estadísticas.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-fg" strokeWidth={2.5} />
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Columna izquierda: perfil, menú y direcciones (diseño 09) */}
        <div className="space-y-4">
          {/* Tarjeta de perfil (sticker) */}
          <div className="sticker p-[18px]">
            <div className="flex items-center gap-3.5">
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border-2 border-ink bg-brand-600 font-display text-lg font-extrabold text-white">
                {initials(profile?.full_name, user.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-fg">
                  {profile?.full_name || 'Completa tu perfil'}
                </p>
                <p className="truncate text-xs font-medium text-fg-subtle">{user.email}</p>
              </div>
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-[12.5px] font-bold text-brand-600 transition hover:text-brand-700"
              >
                {editing ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            {editing && (
              <form onSubmit={handleSave} className="mt-4 space-y-3 border-t-2 border-ink pt-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                    Nombre
                  </label>
                  <input
                    className="field"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                    Teléfono
                  </label>
                  <input
                    className="field"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full rounded-[10px] py-2.5 font-display text-xs font-extrabold uppercase tracking-[.06em] text-white transition ${
                    saved ? 'bg-state-paid' : 'bg-ink hover:bg-ink-2'
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

          {/* Menú (diseño 1b: filas con divisor negro) */}
          <div className="divide-y-2 divide-ink overflow-hidden rounded-[10px] border-2 border-ink bg-white">
            <a href="#pedidos" className={menuItem}>
              <span className={menuIcon}>
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-fg">Mis pedidos</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" strokeWidth={2.5} />
            </a>
            <Link to="/favoritos" className={menuItem}>
              <span className={menuIcon}>
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-fg">Favoritos</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" strokeWidth={2.5} />
            </Link>
            <a href="#direcciones" className={menuItem}>
              <span className={menuIcon}>
                <MapPin className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-fg">Direcciones</span>
              <ChevronRight className="h-4 w-4 text-fg-subtle" strokeWidth={2.5} />
            </a>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className={menuIcon}>
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-fg">Notificaciones</span>
              <button
                onClick={toggleNotif}
                role="switch"
                aria-checked={notifOn}
                aria-label="Notificaciones"
                className={`relative h-[23px] w-10 shrink-0 rounded-full border-2 border-ink transition ${
                  notifOn ? 'bg-brand-600' : 'bg-surface-3'
                }`}
              >
                <span
                  className={`absolute top-[2px] h-[15px] w-[15px] rounded-full bg-white transition-all ${
                    notifOn ? 'left-[19px]' : 'left-[2px]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div className="sticker p-[18px]">
            <div className="flex items-center gap-3">
              <span className={menuIcon}>
                <KeyRound className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-fg">Cambiar contraseña</span>
              <button
                onClick={() => {
                  setPwOpen((v) => !v)
                  setPwError('')
                  setPwForm({ current: '', password: '', confirm: '' })
                }}
                className="text-[12.5px] font-bold text-brand-600 transition hover:text-brand-700"
              >
                {pwOpen ? 'Cerrar' : 'Cambiar'}
              </button>
            </div>

            {pwOpen && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t-2 border-ink pt-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className="field"
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                    placeholder="Tu contraseña de ahora"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="field"
                    value={pwForm.password}
                    onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="field"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                {pwError && (
                  <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-2.5 text-[12.5px] font-semibold text-white">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {pwError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwSaving}
                  className={`w-full rounded-[10px] py-2.5 font-display text-xs font-extrabold uppercase tracking-[.06em] text-white transition ${
                    pwSaved ? 'bg-state-paid' : 'bg-ink hover:bg-ink-2'
                  }`}
                >
                  {pwSaving ? (
                    <Spinner size={5} className="mx-auto border-white/40 border-t-white" />
                  ) : pwSaved ? (
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" /> Contraseña actualizada
                    </span>
                  ) : (
                    'Guardar contraseña'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Cerrar sesión (contorno rojo, diseño 1b) */}
          <button
            onClick={handleLogout}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[10px] border-2 border-brand-600 font-display text-xs font-extrabold uppercase tracking-[.06em] text-brand-600 transition hover:bg-brand-600 hover:text-white"
          >
            <LogOut className="h-[15px] w-[15px]" strokeWidth={2} />
            Cerrar sesión
          </button>

          {/* Direcciones */}
          <div id="direcciones" className="scroll-mt-32">
            <AddressManager userId={user.id} />
          </div>
        </div>

        {/* Historial de pedidos (diseño 09) */}
        <div id="pedidos" className="scroll-mt-32">
          <h2 className="mb-3.5 font-display text-lg font-extrabold uppercase text-fg">
            Mis pedidos
          </h2>
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-ink py-16 text-center">
              <div className="sticker mx-auto grid h-14 w-14 place-items-center rounded-full">
                <Package className="h-7 w-7 text-fg" />
              </div>
              <p className="mt-4 font-display font-extrabold uppercase text-fg">
                Aún no tienes pedidos
              </p>
              <Link
                to="/catalogo"
                className="mt-3 inline-block text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {orders.map((o) => {
                const itemCount = o.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0
                const active = ACTIVE_STATES.includes(o.status)
                return (
                  <div key={o.id} className="rounded-[10px] border-2 border-ink bg-white px-[18px] py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/cuenta/pedidos/${o.id}`} className="min-w-0 transition hover:opacity-80">
                        <p className="font-mono text-base font-bold text-fg">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-[11.5px] font-medium text-fg-subtle">
                          {fmtDate(o.created_at)} · {itemCount} artículo{itemCount === 1 ? '' : 's'}
                        </p>
                      </Link>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-3">
                      <span className="price-tag text-[15px]">{formatPrice(o.total)}</span>
                      {active ? (
                        <Link
                          to={`/cuenta/pedidos/${o.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-brand-600 px-3.5 py-2 font-display text-[11px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          Seguir pedido
                          <ArrowRight className="h-3 w-3" strokeWidth={3} />
                        </Link>
                      ) : (
                        <button
                          onClick={() => rebuy(o)}
                          disabled={rebuying === o.id}
                          className="text-xs font-bold text-[#4a4a4a] underline transition hover:text-fg disabled:opacity-50"
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
