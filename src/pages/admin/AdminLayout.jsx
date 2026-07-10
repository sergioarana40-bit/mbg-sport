import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  Ticket,
  ShoppingBag,
  LogOut,
  Store,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/cupones', label: 'Cupones', icon: Ticket },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
    }`

  const sidebar = (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        <Logo light />
        <button
          onClick={() => setOpen(false)}
          className="grid h-9 w-9 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={linkClass}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          to="/"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <Store className="h-5 w-5" />
          Ver tienda
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink text-fg">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">{sidebar}</aside>

      {/* Sidebar móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-60">{sidebar}</div>
        </div>
      )}

      {/* Contenido */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4">
          <button
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display text-lg font-bold tracking-tight text-fg">
            Panel de administración
          </span>
          <span className="ml-auto hidden text-sm text-fg-muted sm:block">
            {user?.email}
          </span>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
