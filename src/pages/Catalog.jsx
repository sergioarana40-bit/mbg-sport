import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Filter, Check, X, ListFilter } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import PriceRange from '../components/PriceRange'
import Spinner from '../components/Spinner'
import { getCategories, getProducts } from '../lib/api'

// Interruptor rojo del póster (40×23, borde negro, perilla blanca).
function Toggle({ on, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-[23px] w-10 shrink-0 rounded-full border-2 border-ink transition ${
        on ? 'bg-brand-600' : 'bg-surface-3'
      }`}
    >
      <span
        className={`absolute top-[2px] h-[15px] w-[15px] rounded-full bg-white transition-all ${
          on ? 'left-[19px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

// Casilla de categoría (cuadro con borde negro; marcada = relleno rojo).
function CategoryCheck({ checked, name, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 py-[5px] text-left"
    >
      <span
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border-2 border-ink transition ${
          checked ? 'bg-brand-600' : 'bg-white'
        }`}
      >
        {checked && <Check className="h-[11px] w-[11px] text-white" strokeWidth={3.2} />}
      </span>
      <span
        className={`text-[13px] font-semibold ${checked ? 'text-fg' : 'text-[#4a4a4a]'}`}
      >
        {name}
      </span>
    </button>
  )
}

export default function Catalog() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const search = searchParams.get('buscar') || ''

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [sort, setSort] = useState('recent')
  const [priceRange, setPriceRange] = useState(null) // null = sin filtro de precio
  const [onlyStock, setOnlyStock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setPriceRange(null)
    getProducts({ categorySlug: slug, search })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [slug, search])

  // Bloquea el scroll del fondo mientras la hoja de filtros está abierta.
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

  const currentCat = categories.find((c) => c.slug === slug)
  const title = search ? `Resultados para "${search}"` : currentCat?.name || 'Todo el catálogo'

  // Límites del slider a partir de los precios reales de la vista actual.
  const bounds = useMemo(() => {
    if (products.length === 0) return null
    const prices = products.map((p) => Number(p.price) || 0)
    const lo = Math.floor(Math.min(...prices))
    const hi = Math.ceil(Math.max(...prices))
    return hi > lo ? [lo, hi] : [lo, lo + 10]
  }, [products])
  const step = bounds && bounds[1] - bounds[0] > 2000 ? 50 : 10
  const range = priceRange ?? bounds

  const filtered = useMemo(() => {
    let list = [...products]
    if (priceRange) list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    if (onlyStock) list = list.filter((p) => (p.stock ?? 0) > 0)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, priceRange, onlyStock, sort])

  const activeFilters = (priceRange ? 1 : 0) + (onlyStock ? 1 : 0)

  function clearFilters() {
    setPriceRange(null)
    setOnlyStock(false)
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  function toggleCategory(catSlug) {
    navigate(catSlug === slug ? '/catalogo' : `/catalogo/${catSlug}`)
  }

  const sortSelect = (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      <ListFilter className="h-[15px] w-[15px] shrink-0" />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="w-auto cursor-pointer appearance-none rounded-lg border-2 border-ink bg-white px-3.5 py-2 text-[13px] font-semibold text-fg outline-none transition focus:border-brand-600"
      >
        <option value="recent">Más recientes</option>
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="name">Nombre (A-Z)</option>
      </select>
    </label>
  )

  // Secciones de filtros (compartidas entre la columna de escritorio y la hoja móvil).
  const priceSection = bounds && range && (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.06em] text-fg-muted">
        Precio
      </p>
      <PriceRange
        min={bounds[0]}
        max={bounds[1]}
        step={step}
        value={range}
        onChange={setPriceRange}
      />
    </div>
  )

  const categorySection = categories.length > 0 && (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.06em] text-fg-muted">
        Categoría
      </p>
      <div>
        {categories.map((c) => (
          <CategoryCheck
            key={c.id}
            checked={c.slug === slug}
            name={c.name}
            onClick={() => toggleCategory(c.slug)}
          />
        ))}
      </div>
    </div>
  )

  const stockSection = (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border-2 border-ink bg-white px-3.5 py-3">
      <span className="text-[12.5px] font-semibold text-fg">Solo productos en stock</span>
      <Toggle on={onlyStock} onClick={() => setOnlyStock((v) => !v)} label="Solo en stock" />
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 lg:py-8">
      {/* Header móvil: flecha atrás + título */}
      <div className="mb-1 flex items-center gap-3 lg:hidden">
        <button
          onClick={goBack}
          aria-label="Volver"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border-2 border-ink bg-white text-fg transition hover:bg-surface-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 truncate font-display text-lg font-extrabold uppercase text-fg">
          {title}
        </h1>
      </div>
      <p className="mb-4 pl-12 text-xs text-fg-subtle lg:hidden">
        {loading ? 'Cargando…' : `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`}
      </p>

      <div className="grid gap-[26px] lg:grid-cols-[236px_1fr]">
        {/* Columna de filtros (escritorio) */}
        <aside className="hidden lg:sticky lg:top-32 lg:flex lg:flex-col lg:gap-6 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold uppercase text-fg">Filtros</h2>
            <button
              onClick={clearFilters}
              className={`text-xs font-bold text-brand-600 transition hover:text-brand-700 ${
                activeFilters > 0 ? '' : 'pointer-events-none opacity-0'
              }`}
            >
              Limpiar
            </button>
          </div>
          {priceSection}
          {categorySection}
          {stockSection}
        </aside>

        {/* Resultados */}
        <div className="min-w-0">
          {/* Encabezado de resultados (escritorio) */}
          <div className="mb-6 hidden items-end justify-between lg:flex">
            <div>
              <h1 className="title-stamp text-2xl">
                <span>{title}</span>
              </h1>
              <p className="mt-2.5 text-[12.5px] font-medium text-fg-subtle">
                {loading
                  ? 'Cargando…'
                  : `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`}
              </p>
            </div>
            {sortSelect}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-ink py-20 text-center">
              <p className="font-display font-extrabold uppercase text-fg">Sin resultados</p>
              <p className="mt-1 text-sm text-fg-muted">
                Ajusta los filtros o prueba con otra categoría.
              </p>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pill flotante de filtros (móvil, diseño 03) */}
      <button
        onClick={() => setFiltersOpen(true)}
        className="fixed bottom-[96px] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-ink bg-brand-600 px-5 py-3 font-display text-[12px] font-extrabold uppercase tracking-[.06em] text-white shadow-hard-sm transition active:scale-95 lg:hidden"
      >
        <Filter className="h-4 w-4" />
        Filtros{activeFilters > 0 && ` · ${activeFilters}`}
      </button>

      {/* Hoja inferior de filtros (móvil, diseño 05) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[26px] border-t-[3px] border-ink bg-white px-5 pb-8 pt-2">
            <span className="mx-auto mb-3.5 block h-1 w-10 rounded-full bg-surface-3" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold uppercase text-fg">Filtros</h2>
              <div className="flex items-center gap-3">
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[12.5px] font-bold text-brand-600"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-2"
                  aria-label="Cerrar"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {priceSection}
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.06em] text-fg-muted">
                  Ordenar
                </p>
                {sortSelect}
              </div>
              {categorySection}
              {stockSection}
            </div>

            <button
              onClick={() => setFiltersOpen(false)}
              className="btn-primary mt-6 w-full py-3.5 text-[15px]"
            >
              Ver {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {/* Enlace de regreso al catálogo completo cuando hay categoría o búsqueda (escritorio usa sidebar) */}
      {(slug || search) && (
        <div className="mt-8 text-center lg:hidden">
          <Link to="/catalogo" className="text-sm font-medium text-fg-muted hover:text-brand-400">
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </div>
  )
}
