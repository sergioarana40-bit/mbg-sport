import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  Package,
  Tags,
  Ticket,
  ShoppingBag,
  LogOut,
  Store,
  Menu,
  Wrench,
  Cable,
  X,
  KeyRound,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import { getPendingOrdersCount, subscribeOrders } from '../../lib/admin'
import { changePassword } from '../../lib/account'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/banner', label: 'Banner', icon: Megaphone },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/cupones', label: 'Cupones', icon: Ticket },
  { to: '/admin/reparaciones', label: 'Servicio', icon: Wrench },
  { to: '/admin/cables', label: 'Cables', icon: Cable },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  // Pedidos por atender (pendientes o pagados sin preparar) para el aviso del menú.
  const [pendingCount, setPendingCount] = useState(0)

  // Cambio de contraseña del administrador (desde el propio panel).
  const EMPTY_PW = { current: '', password: '', confirm: '' }
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState(EMPTY_PW)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  function openPasswordModal() {
    setPwForm(EMPTY_PW)
    setPwError('')
    setPwDone(false)
    setPwOpen(true)
    setOpen(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
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
    setPwError('')
    try {
      await changePassword(pwForm.current, pwForm.password)
      setPwForm(EMPTY_PW)
      setPwDone(true)
    } catch (err) {
      setPwError(err.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setPwSaving(false)
    }
  }

  // Suscripción única al montar: Realtime + refresco periódico de respaldo.
  useEffect(() => {
    let alive = true
    const refresh = () =>
      getPendingOrdersCount()
        .then((n) => alive && setPendingCount(n))
        .catch(() => {})
    refresh()
    const unsubscribe = subscribeOrders(refresh)
    const interval = setInterval(refresh, 60_000)
    return () => {
      alive = false
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // Recalcula al navegar dentro del panel (p. ej. tras cambiar estados en Pedidos).
  useEffect(() => {
    getPendingOrdersCount()
      .then(setPendingCount)
      .catch(() => {})
  }, [pathname])

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  // Sidebar negro del póster 1b: activo = bloque rojo, resto gris.
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12.5px] font-bold uppercase tracking-[.04em] transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-[#9a9aa0] hover:bg-white/10 hover:text-white'
    }`

  const footerLink =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[12.5px] font-semibold uppercase tracking-[.04em] text-[#9a9aa0] transition hover:bg-white/10 hover:text-white'

  const sidebar = (
    <div className="flex h-full flex-col bg-ink">
      <div className="flex h-16 items-center justify-between border-b border-ink-line px-4">
        <Logo size={26} />
        <button
          onClick={() => setOpen(false)}
          className="grid h-9 w-9 place-items-center rounded-lg text-[#9a9aa0] hover:bg-white/10 lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1.5 p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={linkClass}
          >
            <item.icon className="h-[17px] w-[17px]" strokeWidth={2} />
            {item.label}
            {item.to === '/admin/pedidos' && pendingCount > 0 && (
              <span className="ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-full border border-ink bg-accent-400 px-1 font-display text-[10.5px] font-extrabold text-fg">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-line p-3">
        <Link to="/tienda" className={footerLink}>
          <Store className="h-4 w-4" strokeWidth={2} />
          Ver tienda
        </Link>
        <button onClick={openPasswordModal} className={footerLink}>
          <KeyRound className="h-4 w-4" strokeWidth={2} />
          Cambiar contraseña
        </button>
        <button onClick={handleLogout} className={footerLink}>
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
      {/* Franja de marca (diseño 1b) */}
      <div className="h-[3px] bg-gradient-to-r from-accent-400 to-brand-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-fg">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-[230px] lg:block">{sidebar}</aside>

      {/* Sidebar móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[230px]">{sidebar}</div>
        </div>
      )}

      {/* Contenido */}
      <div className="lg:pl-[230px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-ink bg-white px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink text-fg hover:bg-surface-2 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-[15px] font-extrabold uppercase tracking-tight text-fg">
            Panel de administración
          </span>
          <span className="ml-auto hidden text-[12.5px] font-medium text-fg-subtle sm:block">
            {user?.email}
          </span>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Modal: cambiar contraseña del administrador */}
      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Cambiar contraseña"
        maxWidth="max-w-md"
      >
        {pwDone ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-state-paid/15 p-3 text-sm font-semibold text-fg">
              <Check className="h-4 w-4 shrink-0 text-state-paid" />
              Contraseña actualizada. Úsala en tu próximo inicio de sesión.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setPwOpen(false)}
                className="btn-primary px-5 py-2 text-sm"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
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
              <label className="mb-1 block text-sm font-medium text-fg-muted">
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
              <label className="mb-1 block text-sm font-medium text-fg-muted">
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
              <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {pwError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPwOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button type="submit" disabled={pwSaving} className="btn-primary px-5 py-2 text-sm">
                {pwSaving && <Spinner size={4} className="border-white/40 border-t-white" />}
                Guardar contraseña
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
