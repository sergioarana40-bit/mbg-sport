import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, NavLink } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
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
  const title = search
    ? `Resultados para "${search}"`
    : currentCat?.name || 'Todo el catálogo'

  const sorted = useMemo(() => {
    const list = [...products]
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, sort])

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? 'bg-brand-50 font-semibold text-brand-700'
        : 'text-neutral-600 hover:bg-neutral-100'
    }`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {loading ? 'Cargando…' : `${sorted.length} producto${sorted.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filtro de categorías */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="mb-2 hidden text-xs font-bold uppercase tracking-wide text-neutral-400 lg:block">
            Categorías
          </h2>
          <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible">
            <NavLink to="/catalogo" end className={linkClass}>
              Todo
            </NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={linkClass}>
                {c.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Resultados */}
        <div>
          <div className="mb-4 flex items-center justify-end">
            <label className="flex items-center gap-2 text-sm text-neutral-500">
              <SlidersHorizontal className="h-4 w-4" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-800 outline-none focus:border-brand-500"
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
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 py-20 text-center">
              <p className="font-semibold text-neutral-700">Sin resultados</p>
              <p className="mt-1 text-sm text-neutral-500">
                Prueba con otra categoría o término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sorted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
