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
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-line p-3">
        <Link to="/" className={footerLink}>
          <Store className="h-4 w-4" strokeWidth={2} />
          Ver tienda
        </Link>
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
    </div>
  )
}
