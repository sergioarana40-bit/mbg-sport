import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, MapPin, Truck, Heart } from 'lucide-react'
import Logo from './Logo'
import UserMenu from './UserMenu'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { getCategories } from '../lib/api'
import { STORE, formatPrice } from '../config'

export default function Header() {
  const { count } = useCart()
  const { count: favCount } = useFavorites()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/catalogo?buscar=${encodeURIComponent(q)}` : '/catalogo')
  }

  // Enlace de categoría: el activo lleva subrayado rojo (diseño 03).
  const linkClass = ({ isActive }) =>
    `whitespace-nowrap text-sm transition hover:text-brand-400 ${
      isActive
        ? 'font-semibold text-fg underline decoration-brand-600 decoration-2 underline-offset-[14px]'
        : 'font-medium text-fg-muted'
    }`

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior */}
      <div className="bg-black text-fg-muted">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <span className="flex min-w-0 items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 shrink-0 text-accent-400" />
            <span className="truncate">
              {STORE.freeShippingFrom
                ? `Envío gratis desde ${formatPrice(STORE.freeShippingFrom).replace(/\.00\b/, '')} · Recoge hoy en tienda`
                : 'Envíos a todo México'}
            </span>
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-accent-400" />
            {STORE.city}
          </span>
        </div>
      </div>

      {/* Barra principal */}
      <div className="border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Logo light />

          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pesas, barras, ropa…"
              className="field pl-9"
            />
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg"
              aria-label="Favoritos"
            >
              <Heart className="h-5.5 w-5.5" />
              {favCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {favCount}
                </span>
              )}
            </Link>
            <UserMenu />
            <Link
              to="/carrito"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5.5 w-5.5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Navegación de categorías (desktop) */}
        <nav className="hidden border-t border-line bg-ink md:block">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo el catálogo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
            <NavLink
              to="/promociones"
              className={({ isActive }) =>
                `ml-auto whitespace-nowrap text-sm font-semibold transition ${
                  isActive ? 'text-accent-400' : 'text-accent-400/80 hover:text-accent-400'
                }`
              }
            >
              Promociones
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  )
}
