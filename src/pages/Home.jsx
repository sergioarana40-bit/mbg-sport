import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowRight, PackageCheck, ShieldCheck, CreditCard, Store, Search } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import CategoryIcon from '../components/CategoryIcon'
import Spinner from '../components/Spinner'
import { getCategories, getProducts } from '../lib/api'
import { STORE, formatPrice } from '../config'

const BENEFITS = [
  { icon: CreditCard, title: 'Pago seguro', text: 'MercadoPago' },
  { icon: PackageCheck, title: 'Recoge en tienda', text: 'Tu pedido listo hoy' },
  { icon: Store, title: 'Tienda física', text: 'Visítanos en Toluca' },
  { icon: ShieldCheck, title: 'Garantía', text: 'Productos originales' },
]

export default function Home() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getCategories(), getProducts({ featured: true })])
      .then(([cats, prods]) => {
        setCategories(cats)
        setFeatured(prods.slice(0, 8))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/catalogo?buscar=${encodeURIComponent(q)}` : '/catalogo')
  }

  const chipClass = ({ isActive }) =>
    `whitespace-nowrap rounded-full px-3.5 py-[7px] text-xs font-medium transition ${
      isActive ? 'bg-brand-600 font-semibold text-white' : 'bg-surface-2 text-fg-muted'
    }`

  const heroImage = featured.find((p) => p.image_url)?.image_url

  return (
    <div>
      {/* Búsqueda + chips de categorías (móvil, diseño 02) */}
      <div className="mx-auto max-w-7xl px-4 pt-3 md:hidden">
        <form onSubmit={submitSearch} className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos…"
            className="field h-[42px] pl-10 text-[13.5px]"
          />
        </form>
        <nav className="no-scrollbar -mx-4 mt-3.5 flex gap-2 overflow-x-auto px-4">
          <NavLink to="/catalogo" end className={chipClass}>
            Todo
          </NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/catalogo/${c.slug}`} className={chipClass}>
              {c.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Hero (diseño 02) */}
      <section className="relative overflow-hidden bg-ink text-fg">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 100% at 85% 0%, rgba(220,38,38,0.5) 0%, rgba(220,38,38,0) 58%), radial-gradient(50% 80% at 0% 100%, rgba(234,179,8,0.14) 0%, rgba(234,179,8,0) 55%)',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl items-center gap-7 px-4 py-12 sm:py-16 lg:py-20">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
            {/* Chip: "Nueva temporada" en pantallas grandes; promo -15% en móvil */}
            <span className="hidden items-center gap-2 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.08em] text-accent-400 sm:inline-flex">
              Nueva temporada · {new Date().getFullYear()}
            </span>
            <Link
              to="/promociones"
              className="inline-flex items-center rounded-full bg-accent-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.06em] text-accent-400 sm:hidden"
            >
              -15% 1ª compra
            </Link>

            <h1 className="max-w-3xl font-display text-[34px] font-bold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
              Domina tu <span className="text-brand-500">entrenamiento</span>
            </h1>
            <p className="hidden max-w-md text-base text-[#d4d4d8] sm:block lg:text-lg">
              {STORE.description}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <Link to="/catalogo" className="btn-primary">
                Ver catálogo
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <a href="#categorias" className="btn-ghost hidden sm:inline-flex">
                Categorías
              </a>
            </div>
          </div>

          {/* Bloque de imagen con badge promo (escritorio, diseño 02) */}
          <div className="relative hidden w-[360px] shrink-0 lg:block">
            <div
              className="flex h-[280px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10"
              style={
                heroImage
                  ? undefined
                  : {
                      background:
                        'repeating-linear-gradient(45deg,#1a1a1f,#1a1a1f 11px,#202027 11px,#202027 22px)',
                    }
              }
            >
              {heroImage ? (
                <img
                  src={heroImage}
                  alt="Producto destacado"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-mono text-[11px] tracking-[.12em] text-fg-subtle">
                  MBG SPORT
                </span>
              )}
            </div>
            <Link
              to="/promociones"
              className="absolute -bottom-3 left-4 rounded-[11px] bg-accent-400 px-3.5 py-2 text-xs font-bold text-ink shadow-[0_8px_20px_rgba(0,0,0,.4)] transition hover:bg-accent-500"
            >
              -15% 1ª compra · MBG15
            </Link>
          </div>
        </div>
      </section>

      {/* Beneficios (diseño 02) */}
      <section className="border-b border-t border-line bg-ink">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`flex items-center gap-3 px-2 py-4 sm:px-5 ${
                i > 0 ? 'sm:border-l sm:border-line' : ''
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand-600/15 text-brand-500 sm:h-10 sm:w-10">
                <b.icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg">{b.title}</p>
                <p className="truncate text-[11.5px] text-fg-subtle">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Categorías
          </h2>
          <Link
            to="/catalogo"
            className="text-sm font-medium text-brand-500 hover:text-brand-400"
          >
            Ver todo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogo/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-500/40"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-fg-muted transition group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon category={c} className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-fg">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados (diseño 02) */}
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Destacados
          </h2>
          <Link
            to="/catalogo"
            className="text-sm font-medium text-brand-500 hover:text-brand-400"
          >
            Ver todo
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Promo banner → página de promociones */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <Link
          to="/promociones"
          className="relative block overflow-hidden rounded-2xl border border-line bg-surface p-6 transition hover:border-brand-500/40 sm:p-8"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(80% 130% at 92% 0%, rgba(220,38,38,.5) 0%, rgba(220,38,38,0) 62%)',
            }}
          />
          <div className="relative">
            <span className="rounded-full bg-accent-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-ink">
              Bienvenida
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-none text-fg sm:text-3xl">
              -15% en tu 1ª compra
            </h3>
            <p className="mt-1.5 text-sm text-[#d4d4d8]">
              Con el código <b className="text-accent-400">MBG15</b> · ver todas las promociones
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </p>
          </div>
        </Link>
      </section>
    </div>
  )
}
