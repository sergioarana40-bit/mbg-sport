import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X, MapPin, Truck } from 'lucide-react'
import Logo from './Logo'
import { useCart } from '../context/CartContext'
import { getCategories } from '../lib/api'
import { STORE, formatPrice } from '../config'

export default function Header() {
  const { count } = useCart()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [mobileOpen, setMobileOpen] = useState(false)
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
    setMobileOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `whitespace-nowrap text-sm font-medium transition hover:text-brand-600 ${
      isActive ? 'text-brand-600' : 'text-neutral-600'
    }`

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior */}
      <div className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-accent-400" />
            {STORE.freeShippingFrom
              ? `Envío gratis desde ${formatPrice(STORE.freeShippingFrom)}`
              : 'Envíos a todo México'}
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-accent-400" />
            {STORE.city}
          </span>
        </div>
      </div>

      {/* Barra principal */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Logo />

          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pesas, barras, ropa…"
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/carrito"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-neutral-700 transition hover:bg-neutral-100"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5.5 w-5.5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg text-neutral-700 transition hover:bg-neutral-100 md:hidden"
              aria-label="Menú"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Navegación de categorías (desktop) */}
        <nav className="hidden border-t border-neutral-100 bg-white md:block">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo el catálogo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitSearch} className="relative border-b border-neutral-100 p-4">
              <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
              />
            </form>
            <nav className="flex flex-col overflow-y-auto p-2">
              <Link
                to="/catalogo"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                Todo el catálogo
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/catalogo/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
