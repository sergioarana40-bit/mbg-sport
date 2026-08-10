import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, LayoutGrid, Search, ShoppingCart, User, X } from 'lucide-react'
import { useCart } from '../context/CartContext'

// Barra de navegación inferior tipo app, visible solo en móvil (PWA).
export default function BottomNav() {
  const { count } = useCart()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')

  function submitSearch(e) {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/catalogo?buscar=${encodeURIComponent(term)}` : '/catalogo')
    setSearchOpen(false)
    setQ('')
  }

  const itemClass = ({ isActive }) =>
    `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`

  return (
    <>
      <nav className="bottom-nav fixed inset-x-0 bottom-0 z-40 md:hidden">
        <NavLink to="/tienda" end className={itemClass}>
          <Home className="h-5.5 w-5.5" />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/catalogo" className={itemClass}>
          <LayoutGrid className="h-5.5 w-5.5" />
          <span>Catálogo</span>
        </NavLink>

        {/* FAB central: búsqueda */}
        <button
          onClick={() => setSearchOpen(true)}
          className="bottom-nav__fab"
          aria-label="Buscar"
        >
          <Search className="h-6 w-6" />
        </button>

        <NavLink to="/carrito" className={itemClass}>
          <span className="relative">
            <ShoppingCart className="h-5.5 w-5.5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          <span>Carrito</span>
        </NavLink>
        <NavLink to="/cuenta" className={itemClass}>
          <User className="h-5.5 w-5.5" />
          <span>Cuenta</span>
        </NavLink>
      </nav>

      {/* Overlay de búsqueda */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 border-b border-line bg-surface p-4">
            <form onSubmit={submitSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar pesas, barras, ropa…"
                  className="field pl-9"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-muted"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
