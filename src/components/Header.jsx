import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, MapPin, Store, Heart } from 'lucide-react'
import Logo from './Logo'
import UserMenu from './UserMenu'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { getCategories } from '../lib/api'
import { STORE } from '../config'

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

  // Enlace de categoría sobre banda negra (diseño 1b): activo blanco con subrayado amarillo.
  const linkClass = ({ isActive }) =>
    `whitespace-nowrap pb-0.5 text-xs font-bold uppercase tracking-[.08em] transition hover:text-white ${
      isActive ? 'border-b-2 border-accent-400 text-white' : 'text-white/65'
    }`

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior roja */}
      <div className="bg-brand-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-xs font-bold">
          <span className="flex min-w-0 items-center gap-1.5">
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Recoge en tienda · Listo hoy</span>
              <span className="hidden sm:inline">Recoge tu pedido en tienda · Listo hoy</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {STORE.branch}
          </span>
        </div>
      </div>

      {/* Banda negra principal */}
      <div className="bg-ink">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-6 px-4 md:h-[76px]">
          <Logo sizeClassName="h-[26px] md:h-10" />

          <form onSubmit={submitSearch} className="relative hidden max-w-[560px] flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pesas, barras, refacciones…"
              className="field-dark pl-9"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 text-white">
            <Link
              to="/favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-lg transition hover:bg-white/10"
              aria-label="Favoritos"
            >
              <Heart className="h-[21px] w-[21px]" />
              {favCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent-400 px-1 text-[10.5px] font-bold text-fg">
                  {favCount}
                </span>
              )}
            </Link>
            <UserMenu />
            <Link
              to="/carrito"
              className="relative grid h-10 w-10 place-items-center rounded-lg transition hover:bg-white/10"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-[21px] w-[21px]" />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent-400 px-1 text-[10.5px] font-bold text-fg">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Buscador móvil dentro de la banda negra */}
        <form onSubmit={submitSearch} className="relative px-4 pb-3 md:hidden">
          <Search className="pointer-events-none absolute left-[27px] top-1/2 h-4 w-4 -translate-y-[calc(50%+6px)] text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos…"
            className="field-dark h-[42px] pl-9"
          />
        </form>

        {/* Navegación de categorías (en móvil se desliza horizontal) */}
        <nav className="border-t border-ink-line">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2.5 md:gap-6 md:py-3">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo el catálogo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
            <NavLink to="/cables" className={linkClass}>
              Arma tu cable
            </NavLink>
            <NavLink
              to="/promociones"
              className={({ isActive }) =>
                `ml-auto whitespace-nowrap text-xs font-bold uppercase tracking-[.08em] transition hover:text-accent-300 ${
                  isActive ? 'text-accent-300' : 'text-accent-400'
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
