import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, NavLink } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { getCategories, getProducts } from '../lib/api'

export default function Catalog() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const search = searchParams.get('buscar') || ''

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [sort, setSort] = useState('recent')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [onlyStock, setOnlyStock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ categorySlug: slug, search })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [slug, search])

  const currentCat = categories.find((c) => c.slug === slug)
  const title = search ? `Resultados para "${search}"` : currentCat?.name || 'Todo el catálogo'

  const filtered = useMemo(() => {
    let list = [...products]
    if (priceMin) list = list.filter((p) => p.price >= Number(priceMin))
    if (priceMax) list = list.filter((p) => p.price <= Number(priceMax))
    if (onlyStock) list = list.filter((p) => (p.stock ?? 0) > 0)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, priceMin, priceMax, onlyStock, sort])

  const activeFilters = (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (onlyStock ? 1 : 0)

  function clearFilters() {
    setPriceMin('')
    setPriceMax('')
    setOnlyStock(false)
  }

  const linkClass = ({ isActive }) =>
    `block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? 'bg-brand-600 font-semibold text-white'
        : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
    }`

  // Panel de filtros de precio / stock (reutilizable en sidebar y hoja móvil).
  const filtersPanel = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Precio</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Desde"
            className="field py-2"
          />
          <span className="text-fg-subtle">–</span>
          <input
            type="number"
            min="0"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Hasta"
            className="field py-2"
          />
        </div>
      </div>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-fg-muted">Solo productos en stock</span>
        <button
          type="button"
          onClick={() => setOnlyStock((v) => !v)}
          role="switch"
          aria-checked={onlyStock}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            onlyStock ? 'bg-brand-600' : 'bg-surface-3'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              onlyStock ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </label>
      {activeFilters > 0 && (
        <button
          onClick={clearFilters}
          className="text-sm font-medium text-brand-400 hover:text-brand-300"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {loading ? 'Cargando…' : `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">
            Categorías
          </h2>
          <nav className="flex flex-col gap-0.5">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t border-line pt-6">{filtersPanel}</div>
        </aside>

        {/* Resultados */}
        <div className="min-w-0">
          {/* Chips de categorías (móvil) */}
          <nav className="no-scrollbar mb-4 flex gap-2 overflow-x-auto lg:hidden">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
          </nav>

          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-fg lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilters > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            <label className="ml-auto flex items-center gap-2 text-sm text-fg-muted">
              <span className="hidden sm:inline">Ordenar:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="field w-auto py-1.5"
              >
                <option value="recent">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-20 text-center">
              <p className="font-semibold text-fg">Sin resultados</p>
              <p className="mt-1 text-sm text-fg-muted">
                Ajusta los filtros o prueba con otra categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hoja inferior de filtros (móvil) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-5 pb-8">
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-surface-3" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-fg">Filtros</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-fg-muted hover:bg-surface-2"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filtersPanel}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">
              Ver {filtered.length} producto{filtered.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
